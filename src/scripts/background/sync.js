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
const isExistedDropbox = async () => {
    const { dropbox } = await browser.storage.local.get({
        dropbox: null
    });
    return dropbox ? Boolean(dropbox.accessToken) : false;
};

const dropboxHelper = new DropboxHelper();
const dropboxSync = debounce(wrapAsyncError(async () => {
    if (dropboxHelper.authState === 'authorized') {
        await dropboxHelper.sync();
    } else {
        await dropboxHelper.initSync();
    }
}), 5000);

// TODO: not effient
function loopSync() {
    dropboxSync();
    setTimeout(() => {
        loopSync();
    }, 1000 * 60 * 60 * 2)
}

loopSync();
browser.storage.onChanged.addListener(wrapAsyncError(async (changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes.dropbox) {
        const dpSetting = changes.dropbox.newValue;
        if (!dpSetting || !dpSetting.accessToken) {
            dropboxHelper.disconnect();
        }
    }
    if (
        !changes.accountInfos &&
        !changes.passwordInfo &&
        !changes.accountInfoVersion &&
        !changes.isEncrypted &&
        !changes.settings) {
        return;
    } else {
        if (await isExistedDropbox()) {
            dropboxSync();
        }
    }
}));
browser.runtime.onMessage.addListener((obj) => {
    if (obj.id === 'DropboxDoDiffAndPatch') {
        const { remoteVersion, localVersion, localData, remoteData } = obj;
        dropboxHelper.doDiffAndPatch({ localData, localVersion }, { remoteData, remoteVersion });
    }
})

window.dropboxHelper = dropboxHelper;
