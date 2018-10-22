async function getAccountInfos() {
    let accountInfos = [];
    accountInfos = await getInfosFromLocal();
    accountInfos = Array.isArray(accountInfos) ? accountInfos : [];
    const storageArea = await getPasswordStorageArea();
    const passwordInfo = await getPasswordInfo(storageArea);
    if (passwordInfo.isEncrypted && passwordInfo.password) {
        accountInfos = await decryptAccountInfos(accountInfos, passwordInfo.password);
    }
    return accountInfos;
}

async function saveAccountInfos(infos) {
    const storageArea = await getPasswordStorageArea();
    const passwordInfo = await getPasswordInfo(storageArea);
    if (passwordInfo.isEncrypted && passwordInfo.password) {
        infos = await encryptAccountInfos(infos, passwordInfo.password);
    }   
    await saveInfosToLocal(infos);
}
async function getInfosFromLocal() {
    const obj = await browser.storage.local.get('accountInfos');
    const {
        accountInfos
    } = obj;
    return accountInfos;
}

function saveInfosToLocal(infos) {
    return browser.storage.local.set({
        accountInfos: infos
    });
}
// encrypt account name/secret tokens/recovery
function encryptAccountInfos(infos, password) {
    return __encryptAndDecrypt(infos, password, 'encrypt');
}
// decrypt account name/secret tokens/recovery
function decryptAccountInfos(infos, password) {
    return __encryptAndDecrypt(infos, password, 'decrypt');
}
async function __encryptAndDecrypt(infos, password, invokeFuncName) {
    const crypto = new MessageEncryption(password);
    const promiseArr = infos.reduce((result, info) => {
        const arr = ['localAccountName', 'localSecretToken', 'localRecovery']
            .reduce((result, key) => {
                    result.push(
                        crypto[invokeFuncName](info[key] || '')
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
    const a = new MessageEncryption('123')
    a.decrypt(infos[0].localAccountName).then(a => console.log(a))
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
    const data = await browser.storage.local.get({
        isEncrypted: false,
    });
    const isEncrypted = data.isEncrypted || false;
    let password = '';
    if (storageArea === 'storage.local') {
        const data = await browser.storage.local.get({
            encryptPassword: '',
        });
        password = data.encryptPassword || '';
    } else {
        password = jsonParse(sessionStorage.getItem('encryptPassword')) || '';
    }
    password = base64Decode(password);
    return {
        isEncrypted,
        password
    };
}

function jsonParse(str) {
    try {
        return JSON.parse(str);
    } catch (error) {
        return null;
    }
}