const sessionKey = 'foxauthWebsiteHasInputPassword';
const sessionUserNameKey = 'foxauthWebsiteInputUserName';
const storage = {
    session: {
        set(key, value) {
            sessionStorage.setItem(key, value)
        },
        get(key) {
            return sessionStorage.getItem(key)
        },
        clear(key) {
            sessionStorage.setItem(key, '')
        },
        remove(key) {
            sessionStorage.removeItem(key)
        }
    },
    cookie: {
        set(key, value, options = {}) {
            let str = `${key}=${value};`
            options = {
                path: '/',
                secure: 'true',
                samesite: 'strict',
                ...options,
            }
            for (const key in options) {
                if (options.hasOwnProperty(key)) {
                    value = options[key]
                    str += ` ${key}=${encodeURIComponent(value)};`
                }
            }
            document.cookie = str;
        },
        get(key) {
            const { cookie } = document;
            const result = cookie
                .split(';')
                .map((pair) => pair.trim().split('='))
                .find((pair) => pair[0] == key);
            if (result) {
                return result[1] || '';
            } else {
                return null;
            }
        },
        clear(key) {
            document.cookie = `${key}=;`;
        },
    }
}

function isMatchCurrentSite(sites, compareType = 'hostname') {
    const currentHost = compareType === 'hostname' ?
        window.location.hostname : window.location.href;
    return sites.some(site => currentHost.indexOf(site) >= 0);
}
// tell background script to execute specific content script
function sendExecHackCodeMessage(filename, url = window.location.hostname) {
    return browser.runtime.sendMessage({
        id: 'execHackCode',
        url,
        filename,
    });
}
async function hackFillTotpDom(totpDom, totpKey) {
    await sendExecHackCodeMessage('setInputValue.js');
    __FOXAUTH_SetInputValue(totpDom, totpKey);
}
function hackAfterFillTotoDom() {
    if (isMatchCurrentSite(['mail.protonmail.com'])) {
        sendExecHackCodeMessage('protonmail.js');
    }
}

function getSessionValue(key) {
    if (isMatchCurrentSite(['atlassian.com'])) {
        return storage.cookie.get(key);
    }
    return storage.session.get(key);
}
function setSessionValue(key, value) {
    if (isMatchCurrentSite(['atlassian.com'])) {
        return storage.cookie.set(key, value, {
            domain: 'atlassian.com'
        });
    }
    storage.session.set(key, value);
}
function clearSessionValue(key) {
    if (isMatchCurrentSite(['atlassian.com'])) {
        return storage.cookie.clear(key);
    }
    storage.session.clear(key);
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
    const prematchedDomain = ["presearch.org", "crowdin.com", "posteo.de", "wordpress.com", "posteo.de", "gitlab.com", "binance.com", "name.com", "lichess.org", "privacy.com", "id.unity.com", "www.pythonanywhere.com"];
    if (prematchedDomain.includes(matchTarget)) {
        matchIssuer = matchTarget;
    } else {
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
            case eq("signin.ea.com"):
                matchIssuer = "Electronic Arts"
                break;
            case eqR(/\.wargaming\.net$/):
                matchIssuer = "WarGame"
                break;
            case eq("bugzilla.mozilla.org"):
                matchIssuer = "Bugzilla@Mozilla"
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
            case eq("www.hexonet.net"):
                matchIssuer = "Control Panel LIVE System"
                break;
            case eqR(/\.battle\.net$/):
                matchIssuer = "Battle.Net"
                break;
            case eqR(/\.wasabisys\.com$/):
                matchIssuer = "Wasabi Technologies"
                break;
            case eqR(/^.*\.wiki.*\.org$/):
                matchIssuer = "Wikimedia"
                break;
            case eq("login.microsoftonline.com"):
                matchIssuer = "Office"
                break;
            case eq("identity.cisco.com"):
                matchIssuer = "CiscoOneIdentity"
                break;
            case eq("panel.op-net.com"):
                matchIssuer = "OneProvider"
                break;
            case eq("console.online.net"):
                matchIssuer = "Online.net"
                break;
            case eq("accounts.epicgames.com"):
                matchIssuer = "Epic Games"
                break;
            case eqR(/www.phantom.*\.com$/):
                matchIssuer = "Phantom"
                break;
            case eq("accounts.logme.in"):
                matchIssuer = "LogMeIn Accounts"
                break;
            case eq("www.jianguoyun.com"):
                matchIssuer = ["NutStore", "坚果云"]
                break;
            case eq("app.vagrantup.com"):
                matchIssuer = "Vagrant Cloud by HashiCorp"
                break;
            case eq("access.ripe.net"):
                matchIssuer = "RIPE NCC"
                break;
            case eq("account.nicovideo.jp"):
                matchIssuer = "niconico"
                break;
            default:
                matchTarget = matchTarget.split('.').reverse();
                matchIssuer = matchTarget[1] || matchTarget[0];
        }
    }
    return matchIssuer;
};

function ignoreFirstAtSymbol(userName) {
    return userName.replace(/@/, '');
}

async function getTotpKey(userName) {
    if (userName) {
        const removeAtIssuer = (function (issuers) {
            return function(account) {
                const { hostname: currentHost } = window.location;
                let matched = issuers.find((issuer) => {
                    if (typeof issuer === 'string') {
                        return issuer === currentHost;
                    } else {
                        return issuer[0] === currentHost;
                    }
                });
                if (!matched) return account;
                if (Array.isArray(matched)) {
                    matched = matched[1];
                }
                account = account.replace(new RegExp(`@${matched}$`), '');
                return account;
            }
        })([
            // [hostname to match, actual issuer]
            ['www.plurk.com', 'plurk'],
            // actual issuer
            'console.online.net'
        ]);

        const issuer = matchOTP();

        const { accountInfos, tabInfo } = await browser.runtime.sendMessage({
            id: 'getAccountAndContainer'
        })

        userName = ignoreFirstAtSymbol(userName)
        const infos = accountInfos.map((item) => {
            item = {...item};
            item.localAccountName = ignoreFirstAtSymbol(removeAtIssuer(item.localAccountName));
            return item;
        });

        const filteredInfos = infos.filter(account => {
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
            if (Array.isArray(issuer)) {
                return issuer.some(i => i.toLowerCase() === account.localIssuer.toLowerCase());
            } else {
            return account.localIssuer.toLowerCase() === issuer.toLowerCase();
            }
        });

        const account = filteredInfos.length === 1 ? filteredInfos[0] :
            filteredInfos.find(
                info => info.localAccountName.toLowerCase() === userName.toLowerCase()
            );

        if (!account) {
            return null;
        }

        const totpKey = await browser.runtime.sendMessage({
            id: 'getTotpKey',
            period: account.localOTPPeriod,
            digits: account.localOTPDigits,
            token: account.localSecretToken,
            otpType: /steam/i.test(account.localIssuer) ? 4 : 1
        });
        return totpKey;
    }
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

    // hack for IFTTT
    if (host.indexOf('ifttt.com') >= 0) {
        return otpOwnerDoc.getElementById('user_tfa_code');
    }
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

    //hack for PyPi
    if (host.indexOf('pypi.org') >= 0) {
        return otpOwnerDoc.getElementById('totp_value');
    }

    //hack for RIPE NCC
    if (host.indexOf('access.ripe.net') >= 0) {
        return otpOwnerDoc.querySelector('[name="securityCode"]');
    }

    // hack for constellix
    if (host.indexOf('constellix.com') >= 0) {
        return otpOwnerDoc.getElementById('timeBasedOneTimePassword');
    }

    return input;
}

async function doFillTotpDom(totpDom, isAutoFill = true) {
    const totpKey = await getTotpKey(getSessionValue(sessionUserNameKey));
    await hackFillTotpDom(totpDom, totpKey);
    clearSessionValue(sessionKey);
    clearSessionValue(sessionUserNameKey);
    totpDom.dispatchEvent(new Event('input', {
        bubbles: true
    }));
    if (isAutoFill) {
        totpDom.dispatchEvent(new Event('focus', {
            bubbles: true
        }));
        hackAfterFillTotoDom();
    }
}


(async function () {

    const obj = await browser.storage.local.get('settings') || {};
    const { settings } = obj || {};
    const onInputUserName = (event) => {
        setSessionValue(sessionUserNameKey, event.target.value);
    }

    if (settings && settings.disableAutofill) {
        return;
    }

    function watchDom() {
        const otpOwnerDocument = getOtpOwnerDocument();
        let userName = getSessionValue(sessionUserNameKey);
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
        };
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
        };
        const handleUserNameNotFound = function() {
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
        };

        if (!userName) {
            if (isMatchCurrentSite(['connect.ubisoft.com/login'], 'href')) {
                const playerInfo = document.getElementsByClassName('player-info')[0];
                if (playerInfo) {
                    const span = playerInfo.querySelector('span');
                    if (span) {
                        const txt = span.textContent;
                        if (txt) {
                            setSessionValue(sessionUserNameKey, txt);
                            return hackAndFindDom();
                        }
                    }
                }
            }

            handleUserNameNotFound();
        } else {
            hackAndFindDom();
        }
    };

    function watchPasswordDom() {
        const otpOwnerDocument = getOtpOwnerDocument();

        if (otpOwnerDocument.querySelector('input[type=password]')) {
            setSessionValue(sessionKey, '1');
            watchDom();
        } else {
            let totpDom = otpOwnerDocument.querySelector('input[type=text],input[type=tel],input[type=number]');
            totpDom = hackTotpDom(totpDom);
            if (getSessionValue(sessionKey) && totpDom) {
                doFillTotpDom(totpDom);
            } else {
                setTimeout(watchPasswordDom, 2000);
            }
        }

    }

    watchPasswordDom();

})();