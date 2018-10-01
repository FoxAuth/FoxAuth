'use strict';

//option page
function openURL(url) {
    browser.tabs.create({
        url: url
    })
}

browser.runtime.onInstalled.addListener(function () {
    browser.runtime.openOptionsPage();
});

/*
    Create all the context menu items.
*/
browser.contextMenus.create({
    id: QR,
    title: "Scan QR code to add TOTP",
    contexts: ['image'],
    icons: {
        "16": "../icons/icon.svg",
        "32": "../icons/icon.svg"
      }
}, onCreated);

/*
    The click event listener, where we perform the appropriate action given the
    ID of the menu item that was clicked.
*/
browser.contextMenus.onClicked.addListener((info, ignored) => {
    if (info.menuItemId == QR) {
        decode(info.srcUrl);
    }
});
