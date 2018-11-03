;
(function (global) {
    const parseQueryString = function (str) {
        var ret = Object.create(null);
        if (typeof str !== 'string') {
            return ret;
        }
        str = str.trim().replace(/^(\?|#|&)/, '');
        if (!str) {
            return ret;
        }
        str.split('&').forEach(function (param) {
            var parts = param.replace(/\+/g, ' ').split('=');
            // Firefox (pre 40) decodes `%3D` to `=`
            // https://github.com/sindresorhus/query-string/pull/37
            var key = parts.shift();
            var val = parts.length > 0 ? parts.join('=') : undefined;
            key = decodeURIComponent(key);
            // missing `=` should be `null`:
            // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
            val = val === undefined ? null : decodeURIComponent(val);
            if (ret[key] === undefined) {
                ret[key] = val;
            } else if (Array.isArray(ret[key])) {
                ret[key].push(val);
            } else {
                ret[key] = [ret[key], val];
            }
        });
        return ret;
    };

    // const authState = {
    //     unauthorized: 'unauthorized',
    //     authorizing: 'authorizing',
    //     authorized: 'authorized'
    // };
    // const syncState = {
    //     idle: 'idle',
    //     syncing: 'syncing',
    //     error: 'error'
    // };
    /**
     * merge two infos into one, from right to left.
     * @param {Array} infosOne
     * @param {Array} infosTwo
     */
    function mergeAccountInfos(infosOne, infosTwo) {
        if (infosOne.length === 0) {
            return Array.isArray(infosTwo) ? [...infosTwo] : [];
        } else if (infosTwo.length === 0) {
            return Array.isArray(infosOne) ? [...infosOne] : [];
        } else {
            return infosTwo.reduce((result, info) => {
                const index = findIndexOfSameAccountInfo(result, info);
                if (index >= 0) {
                    result[index] = {
                        ...(result[index]),
                        ...info
                    };
                } else {
                    result.push(info);
                }
                return result;
            }, [...infosOne]);
        }
    }
    // merge local data and remote data
    async function mergeLocalAndRemote({
        localData,
        localVersion
    }, {
        remoteData,
        remoteVersion
    }) {
        if (remoteVersion === 0 || remoteVersion === localVersion) {
            return localData;
        } else {
            let result = {};
            const { accountInfos: remoteAccountInfos, ...otherRemoteData } = remoteData;
            const { accountInfos: localAccountInfos, ...otherLocalData } = localData;
            if (remoteVersion < localVersion) {
                if (otherRemoteData.isEncrypted === false && otherLocalData.isEncrypted === true) {
                    const localPasswordInfo = await getPasswordInfo();
                    result = {
                        accountInfos: await encryptAccountInfos(remoteAccountInfos, {
                            encryptPassword: localPasswordInfo.password,
                            encryptIV: localPasswordInfo.encryptIV
                        }),
                        ...otherRemoteData,
                        ...otherLocalData
                    };
                } else if (otherRemoteData.isEncrypted === true && otherLocalData.isEncrypted === false) {
                    result = {
                        accountInfos: localAccountInfos,
                        ...otherLocalData
                    };
                } else {
                    result = {
                        accountInfos: mergeAccountInfos(remoteAccountInfos, localAccountInfos),
                        ...otherRemoteData,
                        ...otherLocalData
                    };
                }
            } else {
                if (otherRemoteData.isEncrypted === false && otherLocalData.isEncrypted === true) {
                    const localPasswordInfo = await getPasswordInfo();
                    result = {
                        accountInfos: await decryptAccountInfos(localAccountInfos, {
                            encryptPassword: localPasswordInfo.password,
                            encryptIV: localPasswordInfo.encryptIV
                        }),
                        ...otherLocalData,
                        ...otherRemoteData,
                    };
                } else if (otherRemoteData.isEncrypted === true && otherLocalData.isEncrypted === false) {
                    result = {
                        accountInfos: remoteAccountInfos,
                        ...otherRemoteData
                    };
                } else {
                    result = {
                        accountInfos: mergeAccountInfos(localAccountInfos, remoteAccountInfos),
                        ...otherLocalData,
                        ...otherRemoteData,
                    };
                }
            }
            return result;
        }
    }
    // read blob as json
    function readAsJSON(blob) {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => {
                try {
                    resolve(JSON.parse(fr.result))
                } catch (error) {
                    const err = new Error('Invalid file contents');
                    err.type = 'INVALID_FILE_CONTENTS';
                    reject(err);
                }
            };
            fr.onerror = () => {
                const err = new Error('Invalid file');
                err.type = 'READ_FILE_ERROR';
                reject(err);
            }
            fr.readAsText(blob);
        });
    }

    class DropboxHelper {
        constructor() {
            this.service = new Dropbox.Dropbox({
                fetch,
                clientId: '5vxzgtarlxe6sio',
            });
            this.config = {
                accessToken: '',
                accountInfoPath: 'AccountInfo',
                accountInfoVersionPath: 'AccountInfoVersion',
            };
            this.authState = 'unauthorized';
            this.syncState = 'idle';
        }
        async init() {
            this.service.setClientSecret('');
            await this.getFromLocal();
            await this.prepare();
        }
        async initSync() {
            await this.init();
            await this.sync();
        }
        async getFromLocal() {
            const data = await browser.storage.local.get({
                dropbox: {}
            });
            const config = data.dropbox || {};
            if (config.accessToken) {
                this.setConfig(config);
                this.service.setAccessToken(config.accessToken);
            }
        }
        setConfig(nextConfig = {}) {
            this.config = {
                ...(this.config),
                ...nextConfig
            };
        }
        getConfig(...keys) {
            if (keys.length === 0) {
                return this.config;
            }
            return keys.reduce((result, key) => {
                result[key] = this.config[key];
                return result;
            }, {});
        }
        get authUrl() {
            return 'https://foxauth.github.io';
        }
        async authorize(callback) {
            const authUrl = this.service.getAuthenticationUrl(this.authUrl);
            const tab = await browser.tabs.create({
                url: authUrl
            });
            this.listenToAuthroizeTab(tab.id, callback);
        }
        listenToAuthroizeTab(authorizeTabId, callback) {
            const listener = async (tabId, changeInfo, tab) => {
                if (tabId !== authorizeTabId) return;
                const index = tab.url.indexOf('#');
                if (index < 0) return;
                const query = parseQueryString(tab.url.slice(index));
                if (query.access_token) {
                    await browser.tabs.remove(tabId);
                    browser.tabs.onUpdated.removeListener(listener);
                    const data = {
                        accessToken: query.access_token
                    };
                    this.setConfig(data);
                    this.service.setAccessToken(query.access_token);
                    // save accessToken to local
                    await browser.storage.local.set({
                        dropbox: data
                    });
                    // ready to do something
                    await this.prepare();
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            };
            browser.tabs.onUpdated.addListener(listener);
        }
        // test if accessToken is correct
        async prepare() {
            try {
                if (this.authState === 'authorizing') return;
                if (!(this.getConfig('accessToken').accessToken)) return;
                this.authState = 'authorizing';
                const user = await this.service.usersGetCurrentAccount();
                this.authState = 'authorized';
            } catch (error) {
                // TODO: handler error
                console.log(error);
                if (typeof error === 'string') throw new Error(error);
                else if (typeof error.message) throw error;
                else if (error.response && error.response.statusText) throw new Error(error.response.statusText);
                else throw new Error('Oops: unknown error occurs');
            }
        }
        async fileDownload({
            path
        }) {
            path = '/' + path;
            const file = await this.service.filesDownload({
                path
            });
            const { fileBlob } = file;
            const data = await readAsJSON(fileBlob);
            return data;
        }
        async getLocalData() {
            const localPasswordInfo = await getPasswordInfo();
            const localInfos = await getInfosFromLocal();
            return {
                accountInfos: localInfos,
                isEncrypted: localPasswordInfo.isEncrypted,
                settings: {
                    passwordStorage: localPasswordInfo.storageArea
                },
                passwordInfo: {
                    encryptIV: localPasswordInfo.encryptIV ? Array.from(localPasswordInfo.encryptIV) : null
                },
            }
        }
        async getRemoteData() {
            const defaultData = {
                accountInfos: [],
                isEncrypted: false,
                passwordInfo: {
                    encryptIV: null
                },
                settings: {
                    passwordStorage: "storage.local"
                },
            };
            try {
                let data = await this.fileDownload({
                    path: this.config.accountInfoPath
                });
                data = {
                    ...defaultData,
                    ...data
                };
                return data;
            } catch (error) {
                if (error.status === 409) {
                    return defaultData;
                }
                throw error;
            }
        }
        async getRemoteAccountInfoVersion() {
            try {
                const version = await this.fileDownload({
                    path: this.config.accountInfoVersionPath
                });
                if (typeof version !== 'number') return 0;
                return version;
            } catch (error) {
                // file not found
                if (error.status === 409) {
                    return 0;
                }
                throw error;
            }
        }
        // TODO
        async sync() {
            if (this.authState !== 'authorized' || this.syncState === 'syncing') {
                return;
            }
            console.log('start sync');
            this.syncState = 'syncing';
            try {
                const remoteVersion = await this.getRemoteAccountInfoVersion();
                const versionData = await browser.storage.local.get({
                    accountInfoVersion: 1
                });
                const { accountInfoVersion: localVersion } = versionData;
                if (localVersion === remoteVersion) return;
                const localData = await this.getLocalData();
                const remoteData = await this.getRemoteData();
                console.log('localversion', localVersion, 'localdata: ', localData);
                console.log('remoteversion', remoteVersion, 'remotedata: ', remoteData);
                // unfortunately, different encryption settings will cause some bugs
                if (Boolean(remoteData.isEncrypted) !== Boolean(localData.isEncrypted)) {
                    throw new Error('Please open sync page to see details');
                } else {
                    await this.doMergeAndUpload({
                        localData, localVersion
                    }, {
                        remoteData, remoteVersion
                    });
                }
                console.log('end sync');
            } catch (error) {
                // TODO: handler error
                console.log(error);
                if (typeof error === 'string') throw new Error(error);
                else if (typeof error.message) throw error;
                else if (error.response && error.response.statusText) throw new Error(error.response.statusText);
                else throw new Error('Oops: unknown error occurs');
            } finally {
                this.syncState = 'idle';
            }
        }
        fileUpload({
            path,
            contents,
            mode = { '.tag': 'overwrite' }
        }) {
            path = '/' + path;
            contents = JSON.stringify(contents) || '';
            return this.service.filesUpload({
                path,
                contents,
                mode
            });
        }
        // disconnect
        async disconnect() {
            await browser.storage.local.remove('dropbox');
            this.setConfig({
                accessToken: ''
            });
            this.authState = 'unauthorized';
        }
        // merge local and remote data, upload the combinded
        async doMergeAndUpload({
            localData,
            localVersion
        }, {
            remoteData,
            remoteVersion
        }) {
            const result = await mergeLocalAndRemote({
                localData,
                localVersion
            }, {
                remoteData,
                remoteVersion
            });
            console.log('remote and local merge: ', result);
            await this.fileUpload({
                path: this.config.accountInfoPath,
                contents: result
            });
            if (localVersion >= remoteVersion) {
                await this.fileUpload({
                    path: this.config.accountInfoVersionPath,
                    contents: localVersion
                });
                await browser.storage.local.set({
                    accountInfos: result.accountInfos,
                    accountInfoVersion: localVersion,
                });
                console.log('local overwrite remote');
            } else {
                await this.fileUpload({
                    path: this.config.accountInfoVersionPath,
                    contents: remoteVersion
                });
                await browser.storage.local.set({
                    accountInfos: result.accountInfos,
                    accountInfoVersion: remoteVersion,
                });
                savePasswordInfo({
                    isEncrypted: result.isEncrypted,
                    nextStorageArea: result.settings.passwordStorage,
                    nextEncryptIV: result.passwordInfo.encryptIV
                });
                console.log('remote overwrite local');
            }
        }
    }
    global.DropboxHelper = DropboxHelper;
}(this))