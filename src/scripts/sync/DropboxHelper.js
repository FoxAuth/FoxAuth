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
                accountInfoPath: 'AccountInfo.json',
                accountInfoVersionPath: 'AccountInfoVersion.json',
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
            const [
                localPasswordInfo,
                localInfos
            ] = await Promise.all([getPasswordInfo(), getInfosFromLocal()]);
            return {
                accountInfos: localInfos,
                isEncrypted: Boolean(localPasswordInfo.isEncrypted),
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
                    accountInfos: Array.isArray(data.accountInfos) ? data.accountInfos : [],
                    isEncrypted: Boolean(data.isEncrypted),
                    passwordInfo: {
                        encryptIV: (data.passwordInfo && data.passwordInfo.encryptIV) || null
                    },
                    settings: {
                        passwordStorage: (data.settings && data.settings.passwordStorage) || "storage.local"
                    },
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
        async getLocalAndRemote() {
            const remoteVersion = await this.getRemoteAccountInfoVersion();
            const { accountInfoVersion: localVersion } = await browser.storage.local.get({
                accountInfoVersion: 1
            });
            const localData = await this.getLocalData();
            const remoteData = await this.getRemoteData();
            return { remoteVersion, localVersion, localData, remoteData };
        }
        // TODO
        async sync() {
            if (this.authState !== 'authorized' || this.syncState === 'syncing') {
                return;
            }
            console.log('start sync');
            this.syncState = 'syncing';
            try {
                const {
                    remoteVersion,
                    localVersion,
                    localData,
                    remoteData
                } = await this.getLocalAndRemote();
                console.log('localversion', localVersion, 'localdata: ', localData);
                console.log('remoteversion', remoteVersion, 'remotedata: ', remoteData);
                // unfortunately, different encryption settings will cause some bugs
                if (Boolean(remoteData.isEncrypted) !== Boolean(localData.isEncrypted)) {
                    throw new Error('Please open sync page to see more details');
                } else {
                    await this.doDiffAndPatch({
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
        async doDiffAndPatch({
            localData,
            localVersion
        }, {
            remoteData,
            remoteVersion
        }) {
            let delta = null;
            if (localVersion > remoteVersion) {
                delta = diffPatcher.diff(remoteData, localData);
            } else if (localVersion < remoteVersion) {
                delta = diffPatcher.diff(localData, remoteData);
            } else {
                if (localData.isEncrypted) {
                    delta = diffPatcher.diff(remoteData, localData);
                } else {
                    delta = diffPatcher.diff(localData, remoteData);
                }
            }
            if (!delta) {
                console.log('no difference, do nothing');
                return;
            }
            // we need both same encryptIV to encrypt/decrypt data
            if (
                localData.isEncrypted &&
                remoteData.isEncrypted &&
                delta.passwordInfo &&
                delta.passwordInfo.encryptIV
            ) {
                throw new Error('Please decrypt your local/remote data first (different encrypt public key).');
            }
            console.log('find difference, apply patch');
            const localOverwriteRemote = () => this.localOverwriteRemote({
                localData,
                localVersion
            });
            const remoteOverwriteLocal = () => this.remoteOverwriteLocal({
                remoteData, remoteVersion, delta
            });
            // local overwrite remote
            if (localVersion > remoteVersion) {
                await localOverwriteRemote();
            } else if (localVersion < remoteVersion) {
            // remote overwrite local
                await remoteOverwriteLocal();
            } else {
                if (localData.isEncrypted) {
                    await localOverwriteRemote();
                } else {
                    await remoteOverwriteLocal();
                }
            }
        }

        async localOverwriteRemote({
            localData, localVersion
        }) {
            await this.fileUpload({
                path: this.config.accountInfoPath,
                contents: localData
            });
            await this.fileUpload({
                path: this.config.accountInfoVersionPath,
                contents: localVersion
            });
        }
        async remoteOverwriteLocal({
            remoteData, remoteVersion, delta
        }) {
            const needToSave = {
                accountInfoVersion: remoteVersion
            };
            if (delta.accountInfos) {
                needToSave.accountInfos = remoteData.accountInfos;
            }
            let promiseTwo = Promise.resolve();
            if (
                delta.isEncrypted ||
                (delta.settings && delta.settings.passwordStorage) ||
                (delta.passwordInfo && delta.passwordInfo.encryptIV)
            ) {
                // do not patch password and encryptIV
                promiseTwo = savePasswordInfo({
                    isEncrypted: remoteData.isEncrypted,
                    nextStorageArea: remoteData.settings.passwordStorage,
                    nextEncryptIV: remoteData.passwordInfo.encryptIV
                });
            }
            const promiseOne = browser.storage.local.set(needToSave);
            await Promise.all([promiseOne, promiseTwo]);
        }
    }
    global.DropboxHelper = DropboxHelper;
}(this))