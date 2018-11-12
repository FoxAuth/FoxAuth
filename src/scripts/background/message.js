import { getAccountInfos } from '/scripts/accountInfo.js';
import { KeyUtilities, OTPType } from '/scripts/dependency/key-utilities.js';

function getTotpKey(period = 30, digits = 6, token) {
    return KeyUtilities.generate(OTPType.totp, token, digits, period);
}
async function getAccountAndContainer() {

    // get account and container or return

    // const accountInfosPromise = getAccountInfos();
    // const contextualIdentitiesPromise = browser.contextualIdentities.query({});
    // const tabInfoPromise = browser.tabs.query({acitve: true});
    // const contextualIdentities = await contextualIdentitiesPromise;
    const [accountInfos, tabInfo] = await Promise.all(
        [getAccountInfos(), browser.tabs.query({ active: true })]
    )
    return {
        accountInfos,
        tabInfo: tabInfo[0]
    }
}

async function execProtonmailHackCode() {
    const tabInfo = await browser.tabs.query({ active: true })
    const tab = tabInfo[0]
    if (tab.url.indexOf('protonmail.com/login') >= 0) {
        await browser.tabs.executeScript(
            tab.id,
            {
                file: '/scripts/content/hack/protonmail.js'
            }
        )
    }
}


browser.runtime.onMessage.addListener(async obj => {
    try {
      let res = null;
      switch (obj.id) {
        case 'getAccountAndContainer':
          res = await getAccountAndContainer();
          break;
        case 'getTotpKey':
          res = getTotpKey(obj.period, obj.digits, obj.token);
          break;
        case 'execProtonmailHackCode':
          res = execProtonmailHackCode()
        default:
          break;
      }
      return Promise.resolve(res);
    } catch (error) {
      console.log(error.message);
    }
})
