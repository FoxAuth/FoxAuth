import './message.js';
import './sync.js';
import doScanQR from '/scripts/doScanQR.js';
import { getAccountInfos, saveAccountInfos } from '/scripts/accountInfo.js';
import { showErrorMsg } from './utils.js';

//option page
/*function openURL(url) {
    browser.tabs.create({
        url: "../options/options.html"
    })
}

browser.runtime.onInstalled.addListener(function () {
    browser.runtime.openOptionsPage();
});*/

/*
    Create all the context menu items.
*/
browser.contextMenus.create({
    id: "scanQR",
    title: "Scan QR code to add TOTP",
    contexts: ["image", "page"],
    icons: {
        "16": "../icons/foxauth16.png",
        "32": "../icons/foxauth32.png"
    }
});

(async function () {
    const obj = await browser.storage.local.get('settings');
    const { settings } = obj;
    if (settings && settings['disableContext']) {
        return;
    }
    browser.contextMenus.create({
        id: "autfillOTP",
        title: "Autofill OTP code",
        contexts: ["editable"],
        icons: {
            "16": "../icons/foxauth16.png",
            "32": "../icons/foxauth32.png"
        }
    });
})();

/*
    The click event listener, where we perform the appropriate action given the
    ID of the menu item that was clicked.
*/
browser.contextMenus.onClicked.addListener(async (info, ignored) => {
    if (info.menuItemId === "scanQR") {
        try {
            await doScanQR();
            browser.notifications.create({
                "type": "basic",
                "iconUrl": "../icons/icon.svg",
                "title": "FoxAuth Authenticator",
                "message": "Account added."
            })
        } catch (error) {
            console.log(error || 'No QR code found.')
        }
    } else if (info.menuItemId === "autfillOTP") {
        const tabInfo = await browser.tabs.query({ active: true });
        browser.tabs.executeScript(
            tabInfo[0].id,
            {
                code: `fillKeyToActiveEl()`,
            }
        )
    }
});

var injectQr_1 = document.createElement('script')
injectQr_1.onload = function () {
    qrcode.callback = function (/*err,*/ result) {
        if (result === 'error decoding QR Code') {
            showErrorMsg('Qrcode decode error.')
        } else {
            if (result.startsWith('otpauth://totp/') || result.startsWith('otpauth://hotp/')) {
                browser.tabs.create({
                    url: browser.runtime.getURL("options/otpinfo.html") + "?" + result
                });
            } else {
                showErrorMsg('OTP not found.')
            }
        }
    }
}

// if info's container has been removed, set its container to ''
async function setInfoNotFoundContainerToNone(container) {
    let infos = await getAccountInfos();
    infos = infos.map((info) => {
        if (info.containerAssign === container.cookieStoreId) {
            info.containerAssign = '';
        }
        return info;
    });
    saveAccountInfos(infos);
}

//add listeners here
browser.contextualIdentities.onRemoved.addListener((changeInfo) => {
    const { contextualIdentity } = changeInfo;
    setInfoNotFoundContainerToNone(contextualIdentity)
});
