// TODO: sessionStorage and decrypt
async function getAccountInfos() {
    let accountInfos = [];
    accountInfos = await getInfosFromLocal();
    return Array.isArray(accountInfos) ? accountInfos : [];
}
// TODO: sessionStorage and encrypt
function saveAccountInfos(infos) {
    saveInfosToLocal(infos);
}
async function getInfosFromLocal() {
    const obj = await browser.storage.local.get('accountInfos');
    const { accountInfos } = obj;
    return accountInfos;
}
function saveInfosToLocal(infos) {
    browser.storage.local.set({
        accountInfos: infos
    });
}
// TODO: encrypt account name/secret tokens/recovery
function encryptAccountInfos() {

}
// TODO: decrypt account name/secret tokens/recovery
function decryptAccountInfos() {

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
