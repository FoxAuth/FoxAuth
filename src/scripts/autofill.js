console.log('2333333', window.location.host);

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
    default:
      matchTarget = matchTarget.split('.').reverse();
      matchIssuer = matchTarget[1] || matchTarget[0];
  }
  return matchIssuer;
};

(async function () {
  console.log('autofitttttll', window.location.host);

  const sessionKey = 'foxauthWebsiteHasInputPassword';

  const issuer = matchOTP();

  const { accountInfos, tabInfo } = await browser.runtime.sendMessage({
    id: 'getAccountAndContainer'
  })

  console.log('received: ', accountInfos, tabInfo);

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
    return;
  }

  const totp = new jsOTP.totp(account.localOTPPeriod || 30, account.localOTPDigits || 6);
  const totpKey = totp.getOtp(account.localSecretToken);

  const getSessionValue = function () {
    return sessionStorage.getItem(sessionKey);
  }
  const setSessionValue = function () {
    sessionStorage.setItem(sessionKey, '1');
  }
  const clearSessionValue = function () {
    sessionStorage.setItem(sessionKey, '');
  }
  const isVisible = function (elem) {
    return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
  };

  function watchDom() {
    console.log('watchdom');
    const passwordDom = [...document.querySelectorAll('input[type=password]')].filter(isVisible).reverse().find(e => e.type = 'password');
    const findTotpDom = function () {
      let allInputDom = [...document.querySelectorAll('input[type=text],input[type=tel],input[type=number],input[type=password]')].filter(isVisible);
      console.log('all input dom');
      const passwordDomIndex = allInputDom.findIndex(e => e === passwordDom);
      console.log('passwordDomIndex', passwordDomIndex);
      if (passwordDomIndex > -1) {
        allInputDom = allInputDom.splice(passwordDomIndex + 1);
      }
      const totpDom = allInputDom.find(e => e.tagName === 'INPUT' && (e.type === 'text' || e.type === 'tel' || e.type === 'number') && !e.value);
      console.log('totpdom');
      if (totpDom) {
        console.log('totpdom.value= key')
        totpDom.value = totpKey;
        clearSessionValue();
        const event = document.createEvent();
        event.initEvent('focus', true, false);
        totpDom.dispatchEvent(event);
      } else {
        console.log('watch dom continue')
        setTimeout(findTotpDom, 2000);
      }
    }
    findTotpDom();
  };

  function watchPasswordDom() {
    console.log('check password dom', document.querySelectorAll('input[type=password]'));
    if (document.querySelector('input[type=password]')) {
      console.log('set')
      setSessionValue();
      watchDom();
    } else {
      console.log('get')
      const totpDom = document.querySelector('input[type=text],input[type=tel],input[type=number]');
      if (getSessionValue() && totpDom) {
        console.log('totpInput.value= key');
        totpDom.value = totpKey;
        clearSessionValue();
        const event = document.createEvent();
        event.initEvent('focus', true, false);
        totpDom.dispatchEvent(event);
      } else {
        console.log('watch password dom continue...');
        setTimeout(watchPasswordDom, 2000);
      }
    }

  }
  watchPasswordDom();

})();
