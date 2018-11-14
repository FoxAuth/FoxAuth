import './dependency/url-otpauth-ng.browser.js';
import { scanImage } from './dependency/jsQRWrap.js';
import {
    getAccountInfos,
    saveAccountInfos,
    mergeAccountInfos
} from './accountInfo.js';

export default async function doScanQR() {
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

    const activeTabs = await browser.tabs.query({
        active: true
    })
    if (activeTabs.length !== 1) return
    const activeTab = activeTabs[0]
    const dataURL = await browser.tabs.captureTab(activeTab.id)
    const image = await getImage(dataURL, activeTab.width, activeTab.height)
    const result = await scanImage(image)
    if (!result) throw new Error('QR code not found');
    // validate and parse URL
    let otpInfo = urlOtpauth.parse(result)
    otpInfo.container = activeTab.cookieStoreId === 'firefox-default' ? '' : activeTab.cookieStoreId
    otpInfo = transform(otpInfo)
    let infos = await getAccountInfos()
    infos = mergeAccountInfos(infos, [otpInfo])
    await saveAccountInfos(infos)
}
