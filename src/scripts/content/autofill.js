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
    function eq(str) { return window.location.hostname === str}
    function eqR(reg) { return reg.test(window.location.hostname) }
  
    var matchTarget = window.location.hostname;
    var matchIssuer;
    switch (true) {
        case eq("www.amazon.cn"):
            matchIssuer = "z.cn"
            break;
        case eq("signin.aws.amazon.com"):
            matchIssuer = "Amazon Web Services"
            break;
        case eq("keepersecurity.com"):
            matchIssuer = "Keeper"
            break;
        case eq("login.live.com"):
            matchIssuer = "Microsoft"
            break;
        case eq("discordapp.com"):
            matchIssuer = "Discord"
            break;
        case eq("wordpress.com"):
            matchIssuer = "WordPress.com"
            break;
        case eq("signin.ea.com"):
            matchIssuer = "Electronic Arts"
            break;
        case eq("presearch.org"):
            matchIssuer = "presearch.org"
            break;
        case eqR(/\.wargaming\.net$/):
            matchIssuer = "WarGame"
            break;
        case eq("crowdin.com"):
            matchIssuer = "crowdin.com"
            break;
        case eq("bugzilla.mozilla.org"):
            matchIssuer = "Bugzilla@Mozilla"
            break;
        case eq("posteo.de"):
            matchIssuer = "Posteo.de"
            break;
        case eqR(/\.services.adobe\.com$/):
            matchIssuer = "Adobe ID"
            break;
        case eq("accounts.nintendo.com"):
            matchIssuer = "Nintendo Account"
            break;
        case eq("csp.he.net"):
        case eq("www.tunnelbroker.net"):
            matchIssuer = "he.net"
            break;
        case eqR(/\.alibabacloud\.com$/):
            matchIssuer = "Aliyun"
            break;
        case eq("store.steampowered.com"):
        case eq("steamcommunity.com"):
            matchIssuer = "Steam"
            break;
        case eqR(/\.battle\.net$/):
            matchIssuer = "Battle.Net"
            break;
        case eq("login.microsoftonline.com"):
            matchIssuer = "Office"
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
            (!userName || account.localAccountName.toLowerCase() === userName.toLowerCase())
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
    const { host, href } = window.location;
    const otpOwnerDoc = getOtpOwnerDocument();

    // hack for reddit
    if (host.indexOf('reddit.com') >= 0) {
        return otpOwnerDoc.getElementById('loginOtp');
    }
    // hack for BMO
    if (host.indexOf('bugzilla.mozilla.org') >= 0) {
        const code = otpOwnerDoc.getElementById('code');
        if (!code) return code;
        if (!isVisible(code)) return null;
        return code;
    }
    // hack for mega
    if (host.indexOf('mega.nz') >= 0) {
        const pinInputs = [...(otpOwnerDoc.getElementsByClassName('pin-input'))];
        return pinInputs.find(isVisible);
    }
    // hack for totanota
    if (href.indexOf('mail.tutanota.com/login') >= 0) {
        const modal = otpOwnerDoc.getElementById('modal');
        if (!modal) return null;
        const totpDom = modal.querySelector('input[type=text]');
        return totpDom;
    }

    return input;
}

async function doFillTotpDom(totpDom, isAutoFill = true) {
    totpDom.value = await getTotpKey(sessionStorage.getItem(sessionUserNameKey));
    clearSessionValue();
    sessionStorage.setItem(sessionUserNameKey, '');
    hackAfterFillTotpDom(totpDom);
    if (isAutoFill) {
        totpDom.dispatchEvent(new Event('focus', {
            bubbles: true
        }));
        execHackCode();
    }
}

function hackAfterFillTotpDom(totpDom) {
    totpDom.dispatchEvent(new Event('input', {
        bubbles: false,
        cancelable: false,
    }));
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
