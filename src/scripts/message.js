
try {

  async function getAccountAndContainer() {

    // get account and container or return

    // const accountInfosPromise = getAccountInfos();
    // const contextualIdentitiesPromise = browser.contextualIdentities.query({});
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
    const totp = new jsOTP.totp(period, digits);
    const totpKey = totp.getOtp(token);
    return totpKey;
  }

  (async function () {
    browser.runtime.onMessage.addListener(async obj => {
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

      return Promise.resolve(res);

    })


  })();


} catch (error) {
  console.log(error.message);
}