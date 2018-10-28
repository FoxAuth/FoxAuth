
try {

  async function getAccountAndContainer() {

    // get account and container or return

    // const accountInfosPromise = getAccountInfos();
    // const contextualIdentitiesPromise = browser.contextualIdentities.query({});
    console.log('b', browser);
    // const tabInfoPromise = browser.tabs.query({acitve: true});
    const accountInfos = await getAccountInfos();
    // const contextualIdentities = await contextualIdentitiesPromise;
    const tabInfo = await browser.tabs.query({ active: true });
    return {
      accountInfos,
      tabInfo: tabInfo[0]
    }
  }

  function getTotpKey(period = 30, digits = 6, token) {
    console.log('gettotpkey');
    console.log('jsotp', jsOTP);
    const totp = new jsOTP.totp(period, digits);
    console.log('totp');
    console.log(totp);
    const totpKey = totp.getOtp(token);
    console.log('key', totpKey);
    return totpKey;
  }

  (async function () {
    browser.runtime.onMessage.addListener(async obj => {
      console.log('recevied: ', obj);
      let res = null;
      switch (obj.id) {
        case 'getAccountAndContainer':
          res = await getAccountAndContainer();
          break;
        case 'getTotpKey':
          res = getTotpKey(obj.period, obj.digits, obj.token);
          break;

        default:
          break;
      }

      console.log('res', res);
      return Promise.resolve(res);

    })


  })();


} catch (error) {
  console.log('e')
  console.log(error.message);
}