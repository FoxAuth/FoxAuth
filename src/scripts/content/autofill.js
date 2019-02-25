const sessionKey = 'foxauthWebsiteHasInputPassword';
const sessionUserNameKey = 'foxauthWebsiteInputUserName';

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
        case "bugzilla.mozilla.org":
            matchIssuer = "Bugzilla@Mozilla"
            break;
        case "posteo.de":
            matchIssuer = "Posteo.de"
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

async function getTotpKey(userName) {

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
        if (
            account.localIssuer.toLowerCase() === issuer.toLowerCase() &&
            (!userName || account.localAccountName === userName)
        ) {
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
    let { activeElement } = document;
    if (activeElement.tagName === 'IFRAME') {
        activeElement = hackTotpDom(activeElement);
    }
    if (activeElement.tagName === 'INPUT') {
        doFillTotpDom(activeElement, false);
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
function getOtpOwnerDocument() {
    const { host } = window.location;

    // hack for reddit
    if (host.indexOf('reddit.com') >= 0) {
        const frames = Array.from(window.frames);
        const loginFrame = frames.find((f) => {
            try {
                return f.location.href.indexOf('www.reddit.com/login') >= 0;
            } catch(error) {
                return false;
            }
        });
        if (loginFrame) return loginFrame.document;
    }
    return window.document;
}
function hackTotpDom(input) {
    const { host } = window.location;

    // hack for reddit
    if (host.indexOf('reddit.com') >= 0) {
        return getOtpOwnerDocument().getElementById('loginOtp');
    }

    return input;
}

async function doFillTotpDom(totpDom, isAutoFill = true) {
    totpDom.value = await getTotpKey(sessionStorage.getItem(sessionUserNameKey));
    clearSessionValue();
    sessionStorage.setItem(sessionUserNameKey, '');
    if (isAutoFill) {
        totpDom.dispatchEvent(new Event('focus', {
            bubbles: true
        }));
        execHackCode();
    }
}


(async function () {

    const obj = await browser.storage.local.get('settings') || {};
    const { settings } = obj || {};
    const onInputUserName = (event) => {
        sessionStorage.setItem(sessionUserNameKey, event.target.value);
    }

    if (settings && settings.disableAutofill) {
        return;
    }

    function watchDom() {
        const otpOwnerDocument = getOtpOwnerDocument();
        let userName = sessionStorage.getItem(sessionUserNameKey);
        const passwordDom = [...otpOwnerDocument.querySelectorAll('input[type=password]')].filter(isVisible).reverse().find(e => e.type = 'password');

        const findTotpDom = function () {
            let allInputDom = [...otpOwnerDocument.querySelectorAll('input[type=text],input[type=tel],input[type=number],input[type=password]')].filter(isVisible);
            const passwordDomIndex = allInputDom.findIndex(e => e === passwordDom);
            if (passwordDomIndex > -1) {
                allInputDom = allInputDom.splice(passwordDomIndex + 1);
            }
            let totpDom = allInputDom.find(e => e.tagName === 'INPUT' && (e.type === 'text' || e.type === 'tel' || e.type === 'number') && !e.value);
            totpDom = hackTotpDom(totpDom);
            if (totpDom) {
                doFillTotpDom(totpDom);
            } else {
                setTimeout(findTotpDom, 2000);
            }
        }
        const hackAndFindDom = function () {
            // hack for reddit
            if (location.host.indexOf('reddit.com') >= 0) {
                const btnElement = otpOwnerDocument.querySelector('button[type=submit]');
                const onRedditSubmitBtnClick = () => {
                    setTimeout(findTotpDom, 500);
                    btnElement.removeEventListener('click', onRedditSubmitBtnClick);
                }
                btnElement.addEventListener('click', onRedditSubmitBtnClick);
                return;
            }

            findTotpDom();
        }

        if (!userName) {
            let allInputDom = [...otpOwnerDocument.querySelectorAll('input[type=text],input[type=tel],input[type=number],input[type=email],input[type=password]')];
            const passwordDomIndex = allInputDom.findIndex(e => e === passwordDom);
            if (passwordDomIndex > - 1) {
                allInputDom = allInputDom.slice(0, passwordDomIndex).reverse();
            }
            const userNameDom = allInputDom.find(e => e.type === 'text' || e.type === 'tel' || e.type === 'number' || e.type === 'email');
            if (!userNameDom) {
                setTimeout(watchDom, 2000);
            } else {
                userNameDom.addEventListener('input', onInputUserName);
                userNameDom.dispatchEvent(new Event('input', {
                    bubbles: false,
                }));
                hackAndFindDom();
            }
        } else {
            hackAndFindDom();
        }
    };

    function watchPasswordDom() {
        const otpOwnerDocument = getOtpOwnerDocument();

        if (otpOwnerDocument.querySelector('input[type=password]')) {
            setSessionValue();
            watchDom();
        } else {
            let totpDom = otpOwnerDocument.querySelector('input[type=text],input[type=tel],input[type=number]');
            totpDom = hackTotpDom(totpDom);
            if (getSessionValue() && totpDom) {
                doFillTotpDom(totpDom);
            } else {
                setTimeout(watchPasswordDom, 2000);
            }
        }

    }

    watchPasswordDom();

})();
