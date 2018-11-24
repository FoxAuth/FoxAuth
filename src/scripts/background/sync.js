import { showErrorMsg } from './utils.js';
import DropboxHelper from '/scripts/sync/DropboxHelper.js';

const debounce = (func, wait) => {
    let timer = null;
    return function debounce() {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            func();
            timer = null;
        }, wait);
    }
};
const wrapAsyncError = (asyncFunc) => (
    async (...args) => {
        try {
            await asyncFunc(...args);
        } catch (error) {
            showErrorMsg(error.message);
        }
    }
);

// TODO: not effient
function loopSync() {
    dropboxSync();
    setTimeout(() => {
        loopSync();
    }, 1000 * 60 * 10)
}

function onMessageDropbox(message) {
    if (!message) return;
    const { id: type } = message;
    if(type === 'doDiffAndPatch') {
        const { remoteVersion, localVersion, localData, remoteData } = message;
        return dropboxHelper.doDiffAndPatch({ localData, localVersion }, { remoteData, remoteVersion });
    } else if (type === 'authorize') {
        return new Promise((resolve) => {
            dropboxHelper.authorize(() => {
                dropboxSync();
                resolve();
            });
        })
    } else if (type === 'disconnect') {
        return dropboxHelper.disconnect();
    } else if (type === 'getLocalAndRemote') {
        return dropboxHelper.getLocalAndRemote();
    } else if (type === 'getAuthState') {
        if (dropboxHelper.authState === 'authorizing') {
            return Promise.resolve('unauthorized');
        }
        return Promise.resolve(dropboxHelper.authState);
    } else if (type === 'getSyncState') {
        return Promise.resolve(dropboxHelper.syncState);
    }
}

const dropboxHelper = new DropboxHelper();
const dropboxSync = debounce(wrapAsyncError(async () => {
    if (dropboxHelper.authState === 'authorized') {
        await dropboxHelper.sync();
    } else {
        await dropboxHelper.initSync();
    }
}), 5000);
loopSync();


browser.storage.onChanged.addListener(wrapAsyncError(async (changes, areaName) => {
    if (areaName !== 'local') return;
    if (
        !changes.accountInfos &&
        !changes.passwordInfo &&
        !changes.accountInfoVersion &&
        !changes.isEncrypted &&
        !changes.settings) {
        return;
    } else {
        dropboxSync();
    }
}));
browser.runtime.onMessage.addListener((obj) => {
    switch(obj.id) {
        case 'dropbox':
            return onMessageDropbox(obj.dropbox);
    }
});
