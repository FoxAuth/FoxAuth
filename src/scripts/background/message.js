import { getAccountInfos } from '/scripts/accountInfo.js';
import { KeyUtilities, OTPType } from '/scripts/dependency/key-utilities.js';

function getTotpKey(token, otpType = OTPType.totp, period = 30, digits = 6) {
    return KeyUtilities.generate(otpType, token, digits, period);
}
async function getAccountAndContainer() {

    // get account and container or return

    // const accountInfosPromise = getAccountInfos();
    // const contextualIdentitiesPromise = browser.contextualIdentities.query({});
    // const tabInfoPromise = browser.tabs.query({acitve: true});
    // const contextualIdentities = await contextualIdentitiesPromise;
    const [accountInfos, tabInfo] = await Promise.all(
        [getAccountInfos(), browser.tabs.query({ active: true, currentWindow: true })]
    )
    return {
        accountInfos,
        tabInfo: tabInfo[0]
    }
}

async function execHackCode(url, filename) {
  const tabInfo = await browser.tabs.query({ active: true, currentWindow: true })
  const tab = tabInfo[0]
  if (tab.url.indexOf(url) >= 0) {
    return browser.tabs.executeScript(
      tab.id,
      {
          file: `/scripts/content/hack/${filename}`
      }
    )
  }
}


browser.runtime.onMessage.addListener(obj => {
    try {
      switch (obj.id) {
        case 'getAccountAndContainer':
          return getAccountAndContainer();
        case 'getTotpKey':
          return Promise.resolve(getTotpKey(obj.token, obj.otpType, obj.period, obj.digits));
        case 'execHackCode':
          return execHackCode(obj.url, obj.filename);
        default:
          break;
      }
    } catch (error) {
      console.log(error.message);
    }
})
