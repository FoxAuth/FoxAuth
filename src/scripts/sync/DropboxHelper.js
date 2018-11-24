import '../dependency/Dropbox-sdk.min.js';
import { parseQueryString, readAsJSON, transformRemoteData } from './helpers.js';
import Base from './Base.js';

export default class DropboxHelper extends Base {
    constructor() {
        super();
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
            return transformRemoteData(data);
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

    localOverwriteRemote({
        localData, localVersion
    }) {
        return Promise.all([
            this.fileUpload({
                path: this.config.accountInfoPath,
                contents: localData
            }),
            this.fileUpload({
                path: this.config.accountInfoVersionPath,
                contents: localVersion
            })
        ]);
    }
}
