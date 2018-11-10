import {
    getPasswordInfo,
    savePasswordInfo,
    getInfosFromLocal,
    mergeAccountInfos,
    encryptAccountInfos
} from './accountInfo.js';
import diffPatcher from './sync/diffPatcher.js';

const fromFoxAuth = document.getElementById('foxauth');
const fromAuthenticator = document.getElementById('authenticator');
const jsonFileInput = document.getElementById('jsonFile');
const overwriteKeys = ['accountInfos', 'isEncrypted', 'passwordInfo', 'settings', 'dropbox'];
const warningMsgDiv = document.querySelector('.warningMsg');
const warningMsgContent = warningMsgDiv.querySelector('.warningMsgContent');
const warningConfirmBtn = warningMsgDiv.querySelector('.warningMsgBtn');
const warningCloseBtn = warningMsgDiv.querySelector('.warningMsgCloseBtn');
const errorMsgDiv = document.querySelector('.errorMsg');
const errorMsgContent = errorMsgDiv.querySelector('.errorMsgContent');
const errorConfirmBtn = errorMsgDiv.querySelector('.errorMsgBtn');
const errorCloseBtn = errorMsgDiv.querySelector('.errorMsgCloseBtn');
const shadowCover = document.querySelector('.warning-cover');
const openMessage = (function () {
    let zIndex = 11;
    return function ({
        message = '',
        confirmBtn,
        confirmBtnText = '',
        container,
        confrimCallback = () => { },
        cancelBtn,
        cancelCallback = () => { },
        contentElement,
    }) {
        // message
        contentElement.textContent = message || 'Oops!';
        // cancel
        const cancelFunc = (type) => {
            container.style.opacity = 0;
            if (type !== 'close') {
                cancelCallback();
            }
            cancelBtn.removeEventListener('click', cancelFunc);
            setTimeout(() => {
                container.style.display = 'none';
                shadowCover.style.display = 'none';
            }, 300);
        };
        cancelBtn.addEventListener('click', cancelFunc);
        // confirm
        if (confirmBtnText === '') {
            confirmBtn.style.display = 'none';
            setTimeout(() => cancelFunc('close'), 3650);
        } else {
            confirmBtn.style.display = 'block';
            const confirmFunc = () => {
                confrimCallback();
                confirmBtn.removeEventListener('click', confirmFunc);
                cancelFunc('close');
            };
            confirmBtn.addEventListener('click', confirmFunc);
            shadowCover.style.display = 'block';
        }
        container.style.zIndex = zIndex++;
        container.style.display = 'flex';
        container.style.opacity = 1;
    };
})();

// foxauth authy google microsoft lastpass authenticator
let importFrom = '';

fromFoxAuth.addEventListener('click', (event) => {
    importFrom = 'foxauth';
    jsonFileInput.click();
});
fromAuthenticator.addEventListener('click', (event) => {
    importFrom = 'authenticator';
    jsonFileInput.click();
});
jsonFileInput.addEventListener('change', async (event) => {
    const { files } = event.target;
    if (files.length === 0) return;
    const file = files[0];
    const data = await doProcess(file, importFrom);
    doImport(data);
});

async function doProcess(file, importFrom) {
    let data = {};
    switch (importFrom) {
        case 'foxauth':
            data = await readJSON(file);
            data = transformOwnJson(data);
            return data;
        case 'authenticator':
            data = await readJSON(file);
            console.log(data);
            data = transformAuthenticator(data);
            return data;
    }
}

function base64Decode(str, encoding = 'utf-8') {
    var bytes = base64js.toByteArray(str);
    return new (TextDecoder || TextDecoderLite)(encoding).decode(bytes);
}
// accountInfo
async function doImport(importData) {
    try {
        const localData = await getLocalData();
        const importIsEncrypted = Boolean(importData.isEncrypted);
        const localIsEncrypted = Boolean(localData.isEncrypted);

        if (importIsEncrypted !== localIsEncrypted) {
            // local encrypted
            if (localIsEncrypted) {
                const { passwordInfo, settings } = localData;
                importData.accountInfos = await encryptAccountInfos(
                    importData.accountInfos,
                    {
                        encryptPassword: passwordInfo.encryptPassword,
                        encryptIV: passwordInfo.encryptIV,
                    }
                );
                importData.isEncrypted = true;
                importData.passwordInfo = {
                    encryptPassword: passwordInfo.encryptPassword,
                    encryptIV: passwordInfo.encryptIV
                };
                if (importData.settings) {
                    importData.settings.passwordStorage = settings.passwordStorage;
                } else {
                    importData.settings = { passwordStorage: settings.passwordStorage };
                }
            } else {
                // import encrypted
                const { passwordInfo = {}, settings = {} } = importData;
                if (!passwordInfo || !passwordInfo.encryptIV) {
                    throw new Error('Import data lost important settings.(encryptIV)');
                } else if (!passwordInfo.encryptPassword) {
                    await savePasswordInfo({
                        isEncrypted: false,
                        nextEncryptIV: passwordInfo.encryptIV,
                        nextStorageArea: (settings && settings.passwordStorage) ? settings.passwordStorage : 'storage.local'
                    });
                    throw new Error('Password not found. Please enter it in sync page');
                }
                localData.accountInfos = await encryptAccountInfos(
                    localData.accountInfos,
                    {
                        encryptPassword: passwordInfo.encryptPassword,
                        encryptIV: passwordInfo.encryptIV,
                    }
                );
            }
        } else if (importIsEncrypted) {
            // both encrypted
            const delta = diffPatcher.diff(localData.passwordInfo, importData.passwordInfo);
            if (delta.encryptIV) throw new Error('JSON encrypted or corrupt.(different encryptIV)');
            if (delta.password) throw new Error('JSON encrypted or corrupt.(different password)');
        }

        const mergedResult = mergeLocalAndImport(localData, importData);
        const { accountInfoVersion } = await browser.storage.local.get({
            accountInfoVersion: 1
        });
        await Promise.all([
            browser.storage.local.set({
                accountInfoVersion: accountInfoVersion + 1,
                ...mergedResult,
            }),
            savePasswordInfo({
                nextStorageArea: mergedResult.settings.passwordStorage || 'storage.local',
                isEncrypted: Boolean(importData.isEncrypted),
                nextEncryptIV: (importData.passwordInfo && importData.passwordInfo.encryptIV) || null,
                nextPassword: (importData.passwordInfo && importData.passwordInfo.encryptPassword) || ''
            })
        ]);
    } catch (error) {
        console.log(error);
        showErrorMessage({
            message: error.message || 'JSON encrypted or corrupt.(unknown error)'
        });
    }
}
async function getLocalData() {
    const [
        localPasswordInfo,
        localInfos,
        services,
    ] = await Promise.all([
        getPasswordInfo(),
        getInfosFromLocal(),
        browser.storage.local.get({
            dropbox: {}
        })
    ]);
    return {
        accountInfos: localInfos,
        isEncrypted: localPasswordInfo.isEncrypted,
        settings: {
            passwordStorage: localPasswordInfo.storageArea
        },
        passwordInfo: {
            encryptIV: localPasswordInfo.encryptIV ? Array.from(localPasswordInfo.encryptIV) : null,
            encryptPassword: localPasswordInfo.password,
        },
        dropbox: services.dropbox || {}
    }
}
function mergeLocalAndImport(localData, importData) {
    const accountInfos = mergeAccountInfos(localData.accountInfos, importData.accountInfos);
    return {
        accountInfos,
        isEncrypted: importData.isEncrypted,
        settings: {
            ...(localData.settings || {}),
            ...(importData.settings || {})
        },
        dropbox: {
            ...(localData.dropbox || {}),
            ...(importData.dropbox || {})
        }
    }
}
function readJSON(file) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => {
            try {
                resolve(JSON.parse(fr.result));
            } catch (error) {
                reject(new Error('Invalid file'));
            }
        };
        fr.onerror = () => {
            reject(new Error('Invalid file'));
        };
        fr.readAsText(file);
    });
}
function transformOwnJson(data) {
    if (!data || typeof data !== 'object') return {};
    const keys = Object.keys(data);
    return keys.reduce((result, key) => {
        if (overwriteKeys.indexOf(key) >= 0) {
            if (key === 'passwordInfo') {
                if (data[key] && data[key].encryptPassword) {
                    data[key].encryptPassword = base64Decode(data[key].encryptPassword);
                }
            }
            result[key] = data[key];
        }
        return result;
    }, {});
}
function transformAuthenticator(data) {
    const accountInfos = Object.keys(data).reduce((result, key) => {
        const value = data[key];
        if (value && value.encrypted === false) {
            let otpType = 'Time based';
            switch (value.type) {
                case 'totp':
                    otpType = 'Time based';
                    break;
                case 'hotp':
                    otpType = 'Counter based';
            }
            result.push({
                containerAssign: '',
                localIssuer: value.issuer,
                localAccountName: value.account,
                localSecretToken: value.secret,
                localRecovery: '',
                localOTPType: otpType,
                localOTPAlgorithm: 'SHA-1',
                localOTPPeriod: '30',
                localOTPDigits: value.type === 'battle' ? '8' : '6'
            });
        }
        return result;
    }, []);
    return {
        accountInfos,
        isEncrypted: false,
    };
}

function showWarningMessage({
    message = 'Warning oops!',
    confirmBtnText = ''
}) {
    return new Promise((resolve, reject) => {
        openMessage({
            message,
            confirmBtn: warningConfirmBtn,
            confirmBtnText,
            container: warningMsgDiv,
            confrimCallback: () => resolve(1),
            cancelBtn: warningCloseBtn,
            cancelCallback: () => resolve(0),
            contentElement: warningMsgContent,
        });
    });
}
function showErrorMessage({
    message = 'Error oops!',
    confirmBtnText = ''
}) {
    return new Promise((resolve, reject) => {
        openMessage({
            message,
            confirmBtn: errorConfirmBtn,
            confirmBtnText,
            container: errorMsgDiv,
            confrimCallback: () => resolve(1),
            cancelBtn: errorCloseBtn,
            cancelCallback: () => resolve(0),
            contentElement: errorMsgContent,
        });
    });
}
