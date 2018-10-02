//option page
function openURL(url) {
    browser.tabs.create({
        url: "../options/options.html"
    })
}

browser.runtime.onInstalled.addListener(function () {
    browser.runtime.openOptionsPage();
});

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

/*
    The click event listener, where we perform the appropriate action given the
    ID of the menu item that was clicked.
*/

browser.contextMenus.onClicked.addListener((info, ignored) => {
    if (info.menuItemId === "scanQR") {
        browser.windows.create({
            url: "../options/otpinfo.html",
            type: "popup",
            height: 700,
            width: 700
        });
        //decode(info.srcUrl);
    }
});