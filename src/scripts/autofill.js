console.log('2333333', window.location.host);

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
      matchTarget = matchTarget.split('.').reverse();
      matchIssuer = matchTarget[1] || matchTarget[0];
  }
  return matchIssuer;
  };

  
(async function () {
  console.log('autofitttttll', window.location.host);  

  const sessionKey = 'foxauthWebsiteHasInputPassword';

  const issuer = matchOTP();

  const {accountInfos, tabInfo} = await browser.runtime.sendMessage({
    id: 'getAccountAndContainer'
  })

  console.log('received: ',accountInfos,tabInfo);

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

  if(!account) {
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



  console.log('load');
  if (document.querySelector('input[type=password]')) {
    console.log('set')
    setSessionValue();
  } else {
    console.log('get')
    if (getSessionValue()) {
      document.querySelector('input[type=text],input[type=tel],input[type=number]').value = totpKey;
    }
    clearSessionValue();
  }
})();
