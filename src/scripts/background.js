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
        browser.tabs.create({
            url: "../options/otpinfo.html"
        });
        //decode(info.srcUrl);
    }
});

//autfill matching
function matchOTP (){
var matchTarget = window.location.hostname;
var matchIssuer;
switch (matchTarget) {
    case "www.amazon.cn":
    matchIssuer = "z.cn"
    break;
    case "signin.aws.amazon.com":
    matchIssuer =""
    break;
    case "keepersecurity.com":
    matchIssuer = ""
    break;
    default:
    matchTarget.split('.').reverse();
    matchIssuer = matchTarget[1] || matchTarget[0];
}};

//add listeners here
browser.contextualIdentities.onCreated.addListener(listener);
browser.contextualIdentities.onRemoved.addListener(listener);
browser.contextualIdentities.onUpdated.addListener(listener);