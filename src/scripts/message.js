async function getAccountAndContainer() {
  
  // get account and container or return

  // const accountInfosPromise = getAccountInfos();
  // const contextualIdentitiesPromise = browser.contextualIdentities.query({});
  console.log('b', browser);
  console.log('b', browser.tabs);
  console.log('b', browser.tabs.query);
  // const tabInfoPromise = browser.tabs.query({acitve: true});
  const accountInfos = await getAccountInfos();
  // const contextualIdentities = await contextualIdentitiesPromise;
  const tabInfo = await browser.tabs.query({active: true});
  return {
    accountInfos,
    tabInfo: tabInfo[0]
  }
}

(async function () {
  browser.runtime.onMessage.addListener(async obj=>{
    console.log('recevied: ', obj.id);
    let res = null;
    switch (obj.id) {
      case 'getAccountAndContainer':
        res = await getAccountAndContainer();
        break;
    
      default:
        break;
    }

    console.log('res', res);
    return Promise.resolve(res);
    
  })
  
  
})();