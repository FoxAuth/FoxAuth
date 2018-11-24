import diffPatcher from './diffPatcher.js';
import { getPasswordInfo, getInfosFromLocal, savePasswordInfo } from '../accountInfo.js';

// const authState = {
//     unauthorized: 'unauthorized',
//     authorizing: 'authorizing',
//     authorized: 'authorized'
// };
// const syncState = {
//     idle: 'idle',
//     syncing: 'syncing',
// };

class Base {
    constructor() {
        this.config = {};
        this.authState = 'unauthorized';
        this.syncState = 'idle';
    }
    // child class should implement this
    init() {}
    getRemoteData() {}
    getRemoteAccountInfoVersion() {}
    localOverwriteRemote() {}
    // parent
    async initSync() {
        await this.init();
        await this.sync();
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
    async getLocalVersion() {
        const { accountInfoVersion } = await browser.storage.local.get({
            accountInfoVersion: 1
        });
        return accountInfoVersion;
    }
    async getLocalAndRemote() {
        const [localData, localVersion, remoteData, remoteVersion] = await Promise.all(
            [this.getLocalData(), this.getLocalVersion(), this.getRemoteData(), this.getRemoteAccountInfoVersion()]
        );
        return { remoteVersion, localVersion, localData, remoteData };
    }
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
            else if (typeof error.message === 'string') throw error;
            else if (error.response && error.response.statusText) throw new Error(String(error.response.statusText));
            else throw new Error('Oops: unknown error occurs');
        } finally {
            this.syncState = 'idle';
        }
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

export default Base;
