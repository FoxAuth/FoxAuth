function loadQuery(string) {
  return string.split('&').reduce((data, piece) => {
    const parts = piece.split('=');
    data[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    return data;
  }, {});
}

function dumpQuery(dict) {
  return Object.keys(dict)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(dict[key])}`)
    .join('&');
}

function register(Factory) {
  serviceClasses.push(Factory);
}

function isScriptFile(name) {
  return /^vm-/.test(name);
}

function getURI(name) {
  return decodeURIComponent(name.slice(3));
}

function getItemFilename({
  name: filename,
  uri
}) {
  return uri ? getFilename(uri) : filename;
}

const BaseService = serviceFactory({
  name: 'base',
  displayName: 'BaseService',
  delayTime: 1000,
  urlPrefix: '',
  metaFile: 'Violentmonkey',
  initialize() {
    this.progress = {
      finished: 0,
      total: 0,
    };
    this.config = serviceConfig(this.name);
    this.authState = serviceState([
      'idle',
      'initializing',
      'authorizing', // in case some services require asynchronous requests to get access_tokens
      'authorized',
      'unauthorized',
      'error',
    ], null, onStateChange);
    this.syncState = serviceState([
      'idle',
      'ready',
      'syncing',
      'error',
    ], null, onStateChange);
    this.lastFetch = Promise.resolve();
    this.startSync = this.syncFactory();
    const events = getEventEmitter();
    ['on', 'off', 'fire']
    .forEach(key => {
      this[key] = (...args) => {
        events[key](...args);
      };
    });
  },
  log(...args) {
    console.log(...args); // eslint-disable-line no-console
  },
  syncFactory() {
    let promise;
    let debouncedResolve;
    const shouldSync = () => this.authState.is('authorized') && getCurrent() === this.name;
    const getReady = () => {
      if (!shouldSync()) return Promise.resolve();
      this.log('Ready to sync:', this.displayName);
      this.syncState.set('ready');
      working = working.then(() => new Promise(resolve => {
          debouncedResolve = debounce(resolve, 10 * 1000);
          debouncedResolve();
        }))
        .then(() => {
          if (shouldSync()) return this.sync();
          this.syncState.set('idle');
        })
        .catch(err => {
          console.error(err);
        })
        .then(() => {
          promise = null;
          debouncedResolve = null;
        });
      promise = working;
    };

    function startSync() {
      if (!promise) getReady();
      if (debouncedResolve) debouncedResolve();
      return promise;
    }
    return startSync;
  },
  prepareHeaders() {
    this.headers = {};
  },
  prepare() {
    this.authState.set('initializing');
    return (this.initToken() ? Promise.resolve(this.user()) : Promise.reject({
        type: 'unauthorized',
      }))
      .then(() => {
        this.authState.set('authorized');
      }, err => {
        if (err && err.type === 'unauthorized') {
          this.authState.set('unauthorized');
        } else {
          console.error(err);
          this.authState.set('error');
        }
        this.syncState.set('idle');
        throw err;
      });
  },
  checkSync() {
    return this.prepare()
      .then(() => this.startSync());
  },
  user: noop,
  handleMetaError(err) {
    throw err;
  },
  getMeta() {
    return this.get({
        name: this.metaFile
      })
      .then(data => JSON.parse(data))
      .catch(err => this.handleMetaError(err));
  },
  initToken() {
    this.prepareHeaders();
    const token = this.config.get('token');
    this.headers.Authorization = token ? `Bearer ${token}` : null;
    return !!token;
  },
  loadData(options) {
    const {
      progress
    } = this;
    let {
      delay
    } = options;
    if (delay == null) {
      delay = this.delayTime;
    }
    let lastFetch = Promise.resolve();
    if (delay) {
      lastFetch = this.lastFetch
        .then(ts => new Promise(resolve => {
          const delta = delay - (Date.now() - ts);
          if (delta > 0) {
            setTimeout(resolve, delta);
          } else {
            resolve();
          }
        }))
        .then(() => Date.now());
      this.lastFetch = lastFetch;
    }
    progress.total += 1;
    onStateChange();
    return lastFetch.then(() => {
        let {
          prefix
        } = options;
        if (prefix == null) prefix = this.urlPrefix;
        const headers = Object.assign({}, this.headers, options.headers);
        let {
          url
        } = options;
        if (url.startsWith('/')) url = prefix + url;
        return request(url, {
          headers,
          method: options.method,
          body: options.body,
          responseType: options.responseType,
        });
      })
      .then(({
        data
      }) => ({
        data
      }), error => ({
        error
      }))
      .then(({
        data,
        error
      }) => {
        progress.finished += 1;
        onStateChange();
        if (error) return Promise.reject(error);
        return data;
      });
  },
  getLocalData() {
    return getScripts();
  },
  getSyncData() {
    return this.getMeta()
      .then(remoteMetaData => Promise.all([{
          name: this.metaFile,
          data: remoteMetaData
        },
        this.list(),
        this.getLocalData(),
      ]));
  },
  sync() {
    this.progress = {
      finished: 0,
      total: 0,
    };
    this.syncState.set('syncing');
    // Avoid simultaneous requests
    return this.prepare()
      .then(() => this.getSyncData())
      .then(([remoteMeta, remoteData, localData]) => {
        const {
          data: remoteMetaData
        } = remoteMeta;
        const remoteMetaInfo = remoteMetaData.info || {};
        const remoteTimestamp = remoteMetaData.timestamp || 0;
        let remoteChanged = !remoteTimestamp ||
          Object.keys(remoteMetaInfo).length !== remoteData.length;
        const now = Date.now();
        const globalLastModified = getOption('lastModified');
        const remoteItemMap = {};
        const localMeta = this.config.get('meta', {});
        const firstSync = !localMeta.timestamp;
        const outdated = firstSync || remoteTimestamp > localMeta.timestamp;
        this.log('First sync:', firstSync);
        this.log('Outdated:', outdated, '(', 'local:', localMeta.timestamp, 'remote:', remoteTimestamp, ')');
        const putLocal = [];
        const putRemote = [];
        const delRemote = [];
        const delLocal = [];
        const updateLocal = [];
        remoteMetaData.info = remoteData.reduce((info, item) => {
          remoteItemMap[item.uri] = item;
          let itemInfo = remoteMetaInfo[item.uri];
          if (!itemInfo) {
            itemInfo = {};
            remoteChanged = true;
          }
          info[item.uri] = itemInfo;
          if (!itemInfo.modified) {
            itemInfo.modified = now;
            remoteChanged = true;
          }
          return info;
        }, {});
        localData.forEach(item => {
          const {
            props: {
              uri,
              position,
              lastModified
            }
          } = item;
          const remoteInfo = remoteMetaData.info[uri];
          if (remoteInfo) {
            const remoteItem = remoteItemMap[uri];
            if (firstSync || !lastModified || remoteInfo.modified > lastModified) {
              putLocal.push({
                local: item,
                remote: remoteItem,
                info: remoteInfo
              });
            } else {
              if (remoteInfo.modified < lastModified) {
                putRemote.push({
                  local: item,
                  remote: remoteItem
                });
                remoteInfo.modified = lastModified;
                remoteChanged = true;
              }
              if (remoteInfo.position !== position) {
                if (remoteInfo.position && globalLastModified <= remoteTimestamp) {
                  updateLocal.push({
                    local: item,
                    remote: remoteItem,
                    info: remoteInfo
                  });
                } else {
                  remoteInfo.position = position;
                  remoteChanged = true;
                }
              }
            }
            delete remoteItemMap[uri];
          } else if (firstSync || !outdated || lastModified > remoteTimestamp) {
            putRemote.push({
              local: item
            });
          } else {
            delLocal.push({
              local: item
            });
          }
        });
        Object.keys(remoteItemMap).forEach(uri => {
          const item = remoteItemMap[uri];
          const info = remoteMetaData.info[uri];
          if (outdated) {
            putLocal.push({
              remote: item,
              info
            });
          } else {
            delRemote.push({
              remote: item
            });
          }
        });
        const promiseQueue = [
          ...putLocal.map(({
            remote,
            info
          }) => {
            this.log('Download script:', remote.uri);
            return this.get(remote)
              .then(raw => {
                const data = parseScriptData(raw);
                // Invalid data
                if (!data.code) return;
                if (info.modified) objectSet(data, 'props.lastModified', info.modified);
                const position = +info.position;
                if (position) data.position = position;
                if (!getOption('syncScriptStatus') && data.config) {
                  delete data.config.enabled;
                }
                return parseScript(data);
              });
          }),
          ...putRemote.map(({
            local,
            remote
          }) => {
            this.log('Upload script:', local.props.uri);
            return getScriptCode(local.props.id)
              .then(code => {
                // XXX use version 1 to be compatible with Violentmonkey on other platforms
                const data = getScriptData(local, 1, {
                  code
                });
                remoteMetaData.info[local.props.uri] = {
                  modified: local.props.lastModified,
                  position: local.props.position,
                };
                remoteChanged = true;
                return this.put(
                  Object.assign({}, remote, {
                    uri: local.props.uri
                  }),
                  JSON.stringify(data),
                );
              });
          }),
          ...delRemote.map(({
            remote
          }) => {
            this.log('Remove remote script:', remote.uri);
            delete remoteMetaData.info[remote.uri];
            remoteChanged = true;
            return this.remove(remote);
          }),
          ...delLocal.map(({
            local
          }) => {
            this.log('Remove local script:', local.props.uri);
            return removeScript(local.props.id);
          }),
          ...updateLocal.map(({
            local,
            info
          }) => {
            const updates = {};
            if (info.position) {
              updates.props = {
                position: info.position
              };
            }
            return updateScriptInfo(local.props.id, updates);
          }),
        ];
        promiseQueue.push(Promise.all(promiseQueue).then(() => sortScripts()).then(changed => {
          if (!changed) return;
          remoteChanged = true;
          return getScripts().then(scripts => {
            scripts.forEach(script => {
              const remoteInfo = remoteMetaData.info[script.props.uri];
              if (remoteInfo) remoteInfo.position = script.props.position;
            });
          });
        }));
        promiseQueue.push(Promise.all(promiseQueue).then(() => {
          const promises = [];
          if (remoteChanged) {
            remoteMetaData.timestamp = Date.now();
            promises.push(this.put(remoteMeta, JSON.stringify(remoteMetaData)));
          }
          localMeta.timestamp = remoteMetaData.timestamp;
          localMeta.lastSync = Date.now();
          this.config.set('meta', localMeta);
          return Promise.all(promises);
        }));
        // ignore errors to ensure all promises are fulfilled
        return Promise.all(promiseQueue.map(promise => promise.then(noop, err => err || true)))
          .then(errors => errors.filter(Boolean))
          .then(errors => {
            if (errors.length) throw errors;
          });
      })
      .then(() => {
        this.syncState.set('idle');
      }, err => {
        this.syncState.set('error');
        this.log('Failed syncing:', this.name);
        this.log(err);
      });
  },
});

const config = {
  client_id: 'f0q12zup2uys5w8',
  redirect_uri: 'https://violentmonkey.github.io/auth_dropbox.html',
};

const Dropbox = BaseService.extend({
  name: 'dropbox',
  displayName: 'Dropbox',
  user() {
    return this.loadData({
        method: 'POST',
        url: 'https://api.dropboxapi.com/2/users/get_current_account',
      })
      .catch(err => {
        if (err.status === 401) {
          return Promise.reject({
            type: 'unauthorized',
          });
        }
        return Promise.reject({
          type: 'error',
          data: err,
        });
      });
  },
  handleMetaError(res) {
    if (res.status === 409) return {};
    throw res;
  },
  list() {
    return this.loadData({
        method: 'POST',
        url: 'https://api.dropboxapi.com/2/files/list_folder',
        body: {
          path: '',
        },
        responseType: 'json',
      })
      .then(data => (
        data.entries.filter(item => item['.tag'] === 'file' && isScriptFile(item.name)).map(normalize)
      ));
  },
  get(item) {
    const name = getItemFilename(item);
    return this.loadData({
      method: 'POST',
      url: 'https://content.dropboxapi.com/2/files/download',
      headers: {
        'Dropbox-API-Arg': JSON.stringify({
          path: `/${name}`,
        }),
      },
    });
  },
  put(item, data) {
    const name = getItemFilename(item);
    return this.loadData({
        method: 'POST',
        url: 'https://content.dropboxapi.com/2/files/upload',
        headers: {
          'Dropbox-API-Arg': JSON.stringify({
            path: `/${name}`,
            mode: 'overwrite',
          }),
          'Content-Type': 'application/octet-stream',
        },
        body: data,
        responseType: 'json',
      })
      .then(normalize);
  },
  remove(item) {
    const name = getItemFilename(item);
    return this.loadData({
        method: 'POST',
        url: 'https://api.dropboxapi.com/2/files/delete',
        body: {
          path: `/${name}`,
        },
        responseType: 'json',
      })
      .then(normalize);
  },
  authorize() {
    const params = {
      response_type: 'token',
      client_id: config.client_id,
      redirect_uri: config.redirect_uri,
    };
    const url = `https://www.dropbox.com/oauth2/authorize?${dumpQuery(params)}`;
    browser.tabs.create({
      url
    });
  },
  authorized(raw) {
    const data = loadQuery(raw);
    if (data.access_token) {
      this.config.set({
        uid: data.uid,
        token: data.access_token,
      });
    }
  },
  checkAuth(url) {
    const redirectUri = `${config.redirect_uri}#`;
    if (url.startsWith(redirectUri)) {
      this.authorized(url.slice(redirectUri.length));
      this.checkSync();
      return true;
    }
  },
  revoke() {
    this.config.set({
      uid: null,
      token: null,
    });
    return this.prepare();
  },
});
register(Dropbox);

function normalize(item) {
  return {
    size: item.size,
    uri: getURI(item.name),
    // modified: new Date(item.server_modified).getTime(),
    // isDeleted: item.is_deleted,
  };
}