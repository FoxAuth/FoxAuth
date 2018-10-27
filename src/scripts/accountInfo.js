async function getInfosFromLocal() {
    const obj = await browser.storage.local.get('accountInfos');
    const {
        accountInfos
    } = obj;
    return Array.isArray(accountInfos) ? accountInfos : [];
}

function saveInfosToLocal(infos) {
    return browser.storage.local.set({
        accountInfos: infos
    });
}

async function getAccountInfos() {
    let accountInfos = [];
    accountInfos = await getInfosFromLocal();
    const passwordInfo = await getPasswordInfo();
    if (passwordInfo.isEncrypted && passwordInfo.password && passwordInfo.encryptIV) {
        accountInfos = await decryptAccountInfos(accountInfos, {
            encryptPassword: passwordInfo.password,
            encryptIV: passwordInfo.encryptIV
        });
    }
    return accountInfos;
}

async function saveAccountInfos(infos) {
    const passwordInfo = await getPasswordInfo();
    if (passwordInfo.isEncrypted && passwordInfo.password && passwordInfo.encryptIV) {
        infos = await encryptAccountInfos(infos, {
            encryptPassword: passwordInfo.password,
            encryptIV: passwordInfo.encryptIV
        });
    }
    let { accountInfoVersion } = await browser.storage.local.get({
        accountInfoVersion: 0
    });
    if (typeof accountInfoVersion !== 'number') {
        accountInfoVersion = 1;
    } else {
        accountInfoVersion += 1;
    }
    await saveInfosToLocal(infos);
    await browser.storage.local.set({
        accountInfoVersion
    });
}
// encrypt account name/secret tokens/recovery
function encryptAccountInfos(infos, passwordInfo) {
    return __encryptAndDecrypt(infos, {
        ...passwordInfo,
        invokeFuncName: 'encrypt'
    });
}
// decrypt account name/secret tokens/recovery
function decryptAccountInfos(infos, passwordInfo) {
    return __encryptAndDecrypt(infos, {
        ...passwordInfo,
        invokeFuncName: 'decrypt'
    });
}
async function __encryptAndDecrypt(infos, encryptInfo) {
    const crypto = new MessageEncryption(encryptInfo.encryptPassword);
    crypto.instance.iv = encryptInfo.encryptIV;
    const promiseArr = infos.reduce((result, info) => {
        const arr = ['localAccountName', 'localSecretToken', 'localRecovery']
            .reduce((result, key) => {
                    result.push(
                        crypto[encryptInfo.invokeFuncName](info[key] || '')
                        .then(value => info[key] = value)
                    );
                    return result;
                },
                []
            );
        result = result.concat(arr);
        return result;
    }, []);
    await Promise.all(promiseArr);
    return infos;
}

// same issuer and containerId
function isSameAccountInfo(info1, info2) {
    return info1.containerAssign === info2.containerAssign &&
        info1.localIssuer !== '' &&
        info2.localIssuer !== '' &&
        info1.localIssuer === info2.localIssuer;
}
// check if same info exists.
function findIndexOfSameAccountInfo(accountInfos, info) {
    return accountInfos.findIndex((item) => isSameAccountInfo(item, info));
}
// default account info
function getDefaultAccountInfo() {
    return {
        containerAssign: '',
        localIssuer: '',
        localAccountName: '',
        localSecretToken: '',
        localRecovery: '',
        localOTPType: 'Time based',
        localOTPAlgorithm: 'SHA-1',
        localOTPPeriod: '30',
        localOTPDigits: '6'
    };
}
async function getPasswordStorageArea() {
    const data = await browser.storage.local.get({
        settings: {
            passwordStorage: 'storage.local'
        }
    });
    if (!data.settings || !data.settings.passwordStorage) {
        return 'storage.local';
    } else {
        return data.settings.passwordStorage;
    }
}
async function getPasswordInfo(storageArea) {
    function base64Decode(str, encoding = 'utf-8') {
        var bytes = base64js.toByteArray(str);
        return new(TextDecoder || TextDecoderLite)(encoding).decode(bytes);
    }

    storageArea = storageArea || await getPasswordStorageArea();
    const data = await browser.storage.local.get({
        isEncrypted: false,
    });
    const isEncrypted = data.isEncrypted || false;
    let passwordInfo = {};
    let password = '';
    let encryptIV = null;
    if (storageArea === 'storage.local') {
        const data = await browser.storage.local.get({
            passwordInfo: {
                encryptPassword: '',
                encryptIV: null
            }
        });
        passwordInfo = data.passwordInfo || {};
    } else {
        passwordInfo = jsonParse(sessionStorage.getItem('passwordInfo')) || {};
    }
    password = base64Decode(passwordInfo.encryptPassword || '');
    encryptIV = passwordInfo.encryptIV || null;
    if (encryptIV) {
        encryptIV = Uint8Array.from(encryptIV);
    }
    return {
        isEncrypted,
        password,
        encryptIV,
        storageArea
    };
}
async function savePasswordInfo({
    isEncrypted,
    nextStorageArea,
    nextPassword,
    nextEncryptIV
}) {
    function base64Encode(str, encoding = 'utf-8') {
        var bytes = new (TextEncoder || TextEncoderLite)(encoding).encode(str);        
        return base64js.fromByteArray(bytes);
    }
    if (typeof isEncrypted !== 'boolean') return;
    await browser.storage.local.set({
        isEncrypted
    });
    if (!isEncrypted) return;
    if (!nextStorageArea) return;
    const settingsData = await browser.storage.local.get({
        settings: {}
    });
    const settings = settingsData.settings;
    await browser.storage.local.set({
        settings: {
            ...settings,
            passwordStorage: nextStorageArea
        },
    });
    if (nextEncryptIV && nextEncryptIV.length > 0) {
        nextEncryptIV = Array.from(nextEncryptIV);
    }
    const data = {
        encryptIV: nextEncryptIV
    };
    if (nextPassword) {
        data.encryptPassword = base64Encode(nextPassword || '');
    }
    if (nextStorageArea === 'storage.local') {
        await browser.storage.local.set({
            passwordInfo: data
        });
    } else {
        sessionStorage.setItem('passwordInfo', JSON.stringify(data));
    }
}

function jsonParse(str) {
    try {
        return JSON.parse(str);
    } catch (error) {
        return null;
    }
}