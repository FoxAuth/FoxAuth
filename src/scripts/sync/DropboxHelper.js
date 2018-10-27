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
    //     ready: 'ready',
    //     syncing: 'syncing',
    //     error: 'error'
    // };
    const errorHandler = () => {
    }
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
    function diff(infosOne, infosTwo) {
    }

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
            file.onerror = () => {
                const err = new Error('Invalid file');
                err.type = 'READ_FILE_ERROR';
                reject(err);
            }
            fr.readAsText(blob);
        });
    }
    // 轮询一天最多24次
    // 采用版本号比对判断是否更新
    // 同步： 下载-》diff-》上传

    class DropboxHelper {
        constructor() {
            this.service = new Dropbox.Dropbox({
                fetch,
                clientId: '5vxzgtarlxe6sio',
            });
            this.config = {
                accessToken: 'cm0b3triqimfrty',
                accountInfoPath: 'accountInfos',
                accountInfoVersionPath: 'accountInfoVersion'
            };
            this.authState = 'unauthorized';
            this.syncState = 'idle';
        }
        async init() {
            this.service.setClientSecret('');
            await this.getFromLocal();
            await this.prepare();
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
                this.sync();
            } catch (error) {
                // TODO: handle error
                this.authState = 'unauthorized';
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
        async sync() {
            if (this.authState !== 'authorized' || this.syncState === 'syncing') {
                return;
            }
            this.syncState = 'syncing';
            let remoteData = [];
            try {
                // await this.fileDownload();
                // diff
                // await this.fileUpload()
            } catch (error) {
                if (error.status && error.status === 409) {
                    remoteData = [];
                } else {
                    // TODO: handle error
                }
                console.log(error);
            }
            // get remote data and get local data
            // diff remote and local
            // put remote data
        }
        fileUpload({
            path,
            contents = '',
            mode = { '.tag': 'overwrite' }
        }) {
            path = '/' + path;
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
    }
    global.DropboxHelper = DropboxHelper;
}(this))