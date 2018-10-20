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

browser.contextMenus.create({
    id: "autfillOTP",
    title: "Autofill OTP code",
    contexts: ["editable"],
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
        if(info.mediaType !== 'image') {
            showErrorMsg('Can not found Image.')
        } else {
            var img = new Image()
            var canvas = document.createElement('canvas')
            var ctx = canvas.getContext("2d")
            img.crossOrigin = ''
            img.onload = function () {
                canvas.width = img.width
                canvas.height = img.height
                ctx.drawImage(img, 0, 0, img.width, img.height)
                decodeQr(canvas)
            }
            img.src = info.srcUrl
        }
        //decode(info.srcUrl);
    }
});

function decodeQr(canvas) {
    var dataURL = canvas.toDataURL("image/png")
    qrcode.decode(dataURL)
}

function showErrorMsg(msg) {
    browser.notifications.create({
        "type": "basic",
        "iconUrl": "../icons/icon.svg",
        "title": "FoxAuth Authenticator",
        "message": msg
    });
}
var injectQr_1 = document.createElement('script')
injectQr_1.onload = function() {
    qrcode.callback = function (/*err,*/ result) {
        if (result === 'error decoding QR Code') {
            showErrorMsg('Qrcode decode error.')
        } else {
            if(result.startsWith('otpauth://totp/' | 'otpauth://hotp/')) {
                browser.tabs.create({
                    url: browser.runtime.getURL("options/otpinfo.html") + "?" + result
                });
            } else {
                showErrorMsg('OTP not found.')
            }
        }
    }
}

//autfill matching
function matchOTP (){
var matchTarget = window.location.hostname;
var matchIssuer;
switch (matchTarget) {
    case "www.amazon.cn":
    matchIssuer = "z.cn"
    break;
    case "signin.aws.amazon.com":
    matchIssuer = "Amazon Web Services"
    break;
    case "keepersecurity.com":
    matchIssuer = "Keeper"
    break;
    case "login.live.com":
    matchIssuer = "Microsoft"
    break;
    case "discordapp.com":
    matchIssuer = "Discord"
    break;
    case "wordpress.com":
    matchIssuer = "WordPress.com"
    break;
    default:
    matchTarget.split('.').reverse();
    matchIssuer = matchTarget[1] || matchTarget[0];
}
return matchIssuer;
};

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

// init account info example
(async function() {
    const result = await browser.contextualIdentities.query({});
    browser.storage.local.set({
        accountInfos: [
            {
                containerAssign: result[0].cookieStoreId,
                localIssuer: 'GitHubExample',
                localAccountName: 'MyName1',
                localSecretToken: 'MyToken1',
                localRecovery: 'MyRecovery1',
                localOTPType: 'Time based',
                localOTPAlgorithm: 'SHA-1',
                localOTPPeriod: '30',
                localOTPDigits: '6'
            }, {
                containerAssign: result[1].cookieStoreId,
                localIssuer: 'DorpboxExample',
                localAccountName: 'MyName2',
                localSecretToken: 'MyToken3',
                localRecovery: 'MyRecovery4',
                localOTPType: 'Time based',
                localOTPAlgorithm: 'SHA-1',
                localOTPPeriod: '30',
                localOTPDigits: '6'
            }
        ]
    });
    
})();