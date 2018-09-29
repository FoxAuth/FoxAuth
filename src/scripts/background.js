'use strict';
// Script for QR menu and page injection

const FQRID = 'foxAuthImportQR';

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
    Called when the item has been created, or when creation failed due to an error.
    We'll just log success/failure here.
*/
function onCreated(ignored) {
    if (browser.runtime.lastError) {
        console.log('Error: ' + browser.runtime.lastError);
    } else {
        console.log('Item created successfully');
    }
}

/*
    Called when the item has been removed.
    We'll just log success here.
*/
function onRemoved() {
    console.log('Item removed successfully');
}

/*
    Called when there was an error.
    We'll just log the error here.
*/
function onError(error) {
    console.log('Error: ' + error);
}

/*
    Create all the context menu items.
*/
browser.contextMenus.create({
    id: FQRID,
    title: _M('QRScan'),
    contexts: ['image']
}, onCreated);

/*
    Execute pageScript
*/
function _EXE(script) {
    return browser.tabs.executeScript({
        file: script
    });
}

/*
    Decode and import QR code
*/
function decode(url) {
    console.log('Decode called with ' + url);
    return;
}

/*
    The click event listener, where we perform the appropriate action given the
    ID of the menu item that was clicked.
*/
browser.contextMenus.onClicked.addListener((info, ignored) => {
    if (info.menuItemId == FQRID) {
        decode(info.srcUrl);
    }
});
