const sessionKey = 'foxauthWebsiteHasInputPassword';
function getSessionValue() {
    return sessionStorage.getItem(sessionKey);
}
function setSessionValue() {
    sessionStorage.setItem(sessionKey, '1');
}
function clearSessionValue() {
    sessionStorage.setItem(sessionKey, '');
}
function isVisible(elem) {
    return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
};
//autfill matching
function matchOTP() {
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
        case "signin.ea.com":
            matchIssuer = "Electronic Arts"
            break;
        case "presearch.org":
            matchIssuer = "www.presearch.org"
            break;
        case "crowdin.com":
            matchIssuer = "crowdin.com"
            break;
        case 1: "account.alibabacloud.com"
        case 2: "account-jp.alibabacloud.com"
            matchIssuer = "Aliyun"
            break;
        case 1: "store.steampowered.com"
        case 2: "steamcommunity.com"
            matchIssuer = "Steam"
            break;
        default:
            matchTarget = matchTarget.split('.').reverse();
            matchIssuer = matchTarget[1] || matchTarget[0];
    }
    return matchIssuer;
};

async function getTotpKey() {

    const issuer = matchOTP();

    const { accountInfos, tabInfo } = await browser.runtime.sendMessage({
        id: 'getAccountAndContainer'
    })


    const account = accountInfos.find(account => {
        let cookieStoreIdMatch = false;
        if (
            (tabInfo.cookieStoreId === 'firefox-default' && (!account.containerAssign))
            ||
            (tabInfo.cookieStoreId === account.containerAssign)
        ) {
            cookieStoreIdMatch = true;
        }
        if (!cookieStoreIdMatch) {
            return false;
        }
        if (account.localIssuer.toLowerCase() === issuer.toLowerCase()) {
            return true;
        }
    });

    if (!account) {
        return '';
    }




    const totpKey = await browser.runtime.sendMessage({
        id: 'getTotpKey',
        period: account.localOTPPeriod,
        digits: account.localOTPDigits,
        token: account.localSecretToken
    });
    return totpKey;
}
async function fillKeyToActiveEl() {
    if (document.activeElement.tagName === 'INPUT') {
        const key = await getTotpKey();
        document.activeElement.value = key;
    }
}

function getActiveTab() {
    return browser.runtime.sendMessage({
        id: 'getActiveTab'
    })
}

function execHackCode() {
    const { href } = window.location
    if (href.indexOf('protonmail.com/login') >= 0) {
        browser.runtime.sendMessage({
            id: 'execProtonmailHackCode'
        })
    }
}
function hackTotpDom(input) {
    const { host } = window.location;

    // hack for reddit
    if (host.indexOf('reddit.com') >= 0) {
        return document.getElementById('otpfield');
    }

    return input;
}


(async function () {

    const obj = await browser.storage.local.get('settings') || {};
    const { settings } = obj || {};

    if (settings && settings.disableAutofill) {
        return;
    }

    const totpKey = await getTotpKey();

    function watchDom() {
        const passwordDom = [...document.querySelectorAll('input[type=password]')].filter(isVisible).reverse().find(e => e.type = 'password');
        const findTotpDom = function () {
            let allInputDom = [...document.querySelectorAll('input[type=text],input[type=tel],input[type=number],input[type=password]')].filter(isVisible);
            const passwordDomIndex = allInputDom.findIndex(e => e === passwordDom);
            if (passwordDomIndex > -1) {
                allInputDom = allInputDom.splice(passwordDomIndex + 1);
            }
            let totpDom = allInputDom.find(e => e.tagName === 'INPUT' && (e.type === 'text' || e.type === 'tel' || e.type === 'number') && !e.value);
            totpDom = hackTotpDom(totpDom);
            if (totpDom) {
                totpDom.value = totpKey;
                clearSessionValue();
                totpDom.dispatchEvent(new Event('focus', {
                    bubbles: true
                }));
                execHackCode();
            } else {
                setTimeout(findTotpDom, 2000);
            }
        }
        findTotpDom();
    };

    function watchPasswordDom() {
        if (document.querySelector('input[type=password]')) {
            setSessionValue();
            watchDom();
        } else {
            let totpDom = document.querySelector('input[type=text],input[type=tel],input[type=number]');
            totpDom = hackTotpDom(totpDom);
            if (getSessionValue() && totpDom) {
                totpDom.value = totpKey;
                clearSessionValue();
                totpDom.dispatchEvent(new Event('focus', {
                    bubbles: true
                }));
                execHackCode();
            } else {
                setTimeout(watchPasswordDom, 2000);
            }
        }

    }
    watchPasswordDom();

})();
