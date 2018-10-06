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
            if(result.startsWith('otpauth://totp/')) {
                browser.windows.create({
                    url: browser.runtime.getURL("options/otpinfo.html") + "?" + result,
                    width: 750,
                    height: 550,
                    type: "popup"
                });
            } else {
                showErrorMsg('TOTP not found.')
            }
        }
    }
}
injectQr_1.src = browser.runtime.getURL('scripts/qr/llqrcode.js')
document.body.appendChild(injectQr_1)
var injectQr_2 = document.createElement('script')
injectQr_2.src = browser.runtime.getURL('scripts/qr/imgproc.js')
document.body.appendChild(injectQr_2)


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
    default:
    matchTarget.split('.').reverse();
    matchIssuer = matchTarget[1] || matchTarget[0];
}};

//add listeners here
browser.contextualIdentities.onCreated.addListener(listener);
browser.contextualIdentities.onRemoved.addListener(listener);
browser.contextualIdentities.onUpdated.addListener(listener);