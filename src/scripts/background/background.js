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
        "16": "../icons/icon.svg",
        "32": "../icons/icon.svg"
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
            "16": "../icons/icon.svg",
            "32": "../icons/icon.svg"
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
            await doScanQR('contextMenu');
        } catch (error) {
            if (error instanceof Error) {
                showErrorMsg(error.message);
            } else {
                showErrorMsg(typeof error === 'string' ? error : 'No QR code found.');
            }
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

async function setBadgeAsLength() {
    var {accountInfos: arr} = await browser.storage.local.get("accountInfos"),
        textString = arr.length.toString();
    browser.browserAction.setBadgeText({text: textString});
    browser.browserAction.setTitle({title: textString + " account(s) added."});
}

browser.browserAction.setBadgeBackgroundColor({color: "#0ff036"});

async function accountInfosChange(changes, areaName) {
    if (changes.accountInfos && areaName === "local"){
        setBadgeAsLength();
        var oldLength = Number(changes.accountInfos.oldValue.length),
            newLength = Number(changes.accountInfos.newValue.length);
        }
        var accountMessage = "";
        function accountMessageTemplate(accountMessage) {
            browser.notifications.create({
                "type": "basic",
                "iconUrl": "../icons/icon.svg",
                "title": "FoxAuth Authenticator",
                "message": accountMessage
            });
            console.log([oldLength,newLength]);
        };
        if (oldLength < newLength) {
            accountMessage = "Account(s) added."
            accountMessageTemplate(accountMessage);
        } else if (oldLength = newLength) {
            accountMessage = "Account(s) overridden."
            accountMessageTemplate(accountMessage);
        } else if (oldLength > newLength) {
            accountMessage = "Account(s) removed."
            accountMessageTemplate(accountMessage);
        }
}

async function handleInstalled(details) {
    if (details.reason) {
        setBadgeAsLength();
    }
}

//add listeners here
browser.contextualIdentities.onRemoved.addListener((changeInfo) => {
    const { contextualIdentity } = changeInfo;
    setInfoNotFoundContainerToNone(contextualIdentity)
});

browser.commands.onCommand.addListener(function(command) {
    if (command == "_execute_browser_action") {
        browser.browserAction.openPopup();
    }
});

browser.storage.onChanged.addListener(accountInfosChange);

browser.runtime.onStartup.addListener(setBadgeAsLength);

browser.runtime.onInstalled.addListener(handleInstalled);