import './dependency/url-otpauth-ng.browser.js';
import { scanImage, scanImageData } from './dependency/jsQRWrap.js';
import {
    getAccountInfos,
    saveAccountInfos,
    mergeAccountInfos
} from './accountInfo.js';

export default async function doScanQR(from) {
    function getImage(url, width, height) {
        return new Promise((resolve, reject) => {
            const image = new Image(width, height)
            image.onload = () => resolve(image)
            image.onerror = () => reject('Can\'t load scan result')
            image.src = url
        });
    }
    function transform(otpInfo) {
        return {
            containerAssign: otpInfo.container || '',
            localIssuer: otpInfo.issuer || '',
            localAccountName: otpInfo.account || '',
            localSecretToken: otpInfo.key || '',
            localRecovery: '',
            localOTPType: otpInfo.type === 'totp' ? 'Time based' : 'Counter based',
            localOTPAlgorithm: 'SHA-1',
            localOTPPeriod: '30',
            localOTPDigits: String(otpInfo.digits) || '6'
        }
    }
    async function doScanTabActiveTab(activeTab) {
        const dataURL = await browser.tabs.captureTab(activeTab.id);
        return doScanDataURL(dataURL, activeTab);
    }
    async function doAfterScan(scanResult, tab) {
        if (!scanResult) throw new Error('QR code not found');
        // validate and parse URL
        let otpInfo = urlOtpauth.parse(scanResult);
        otpInfo = hackOtpInfo(otpInfo, tab.url);
        otpInfo.container = tab.cookieStoreId === 'firefox-default' ? '' : tab.cookieStoreId
        otpInfo = transform(otpInfo)
        let infos = await getAccountInfos()
        infos = mergeAccountInfos(infos, [otpInfo])
        return saveAccountInfos(infos)
    }
    async function doScanDataURL(dataURL, tab) {
        const image = await getImage(dataURL, tab.width, tab.height)
        const result = await scanImage(image)
        return doAfterScan(result, tab);
    }
    async function handleClickContextMenu(tab) {
        await browser.tabs.executeScript(tab.id, {
            file: '/scripts/common/getImageData.js'
        });
        const imageData = await browser.tabs.executeScript(tab.id, {
            file: '/scripts/content/getActiveElImageData.js'
        });
        if (!imageData || imageData[0] === null) {
            return doScanTabActiveTab(tab);
        } else {
            return doAfterScan(scanImageData(imageData), tab);
        }
    }

    const activeTabs = await browser.tabs.query({
        active: true
    })
    if (activeTabs.length !== 1) return
    const activeTab = activeTabs[0]

    if (from === 'contextMenu') {
        await handleClickContextMenu(activeTab);
    } else {
        await doScanTabActiveTab(activeTab);
    }
}

function buildIsLike(url) {
    return function(reg) {
        return reg.test(url);
    }
}

function hackOtpInfo(otpInfo, from) {
    const isLike = buildIsLike(from);

    otpInfo = {...otpInfo};
    switch(true) {
        // otpauth://totp/Autodesk?secret=G5XEYVZYNRXUEWSK
        case isLike(/autodesk/i):
            otpInfo.issuer = 'AutoDesk';
            break;
        case isLike(/synology/i):
            otpInfo.issuer = 'Synology';
            break;
        case isLike(/codegiant/i):
            otpInfo.issuer = "Codegiant";
            break;
        case isLike(/liuli/i):
            otpInfo.issuer = "liuli";
            break;
        case isLike(/npmjs/i):
            otpInfo.issuer = "npmjs";
            break;
        case isLike(/inwx/i):
            otpInfo.issuer = "INWX";
            break;
    }
    return otpInfo;
}
