const serviceIconNames = getServiceIconNames();
const iconOnError = function (e) {
  e.src = '../icons/service/fallback.svg';
}
const containerIconOnError = function (e) {
  e.parentNode.removeChild(e);
}
const getSvgNameByIssuer = function (i) {
  switch (i) {
    case 'z.cn':
      return 'amazon';
      break;
    case 'Amazon Web Services':
      return 'aws';
      break;
    case 'WordPress.com':
      return 'wordpress';
      break;
    default:
      return i.toLowerCase();
  }
}
/**
 * 
 * @param {string} issuer
 * @param {string} url https://www.amazon.com/
 */
const isIssuerMatchedUrl = function (issuer, url) {
  if (!issuer || !url) {
    return false;
  }
  const reg = /:\/\/(.*?)\//i;
  const res = reg.exec(url);
  if (!res || !res[1]) {
    return false;
  }
  const hostnameReversedArray = res[1].split('.').reverse();
  let issuerStr;
  switch (issuer) {
    case 'z.cn':
      issuerStr = 'amazon.cn';
      break;
    case 'Amazon Web Services':
      issuerStr = 'aws.amazon.com';
      break;
    case 'Keeper':
      issuerStr = 'keepersecurity.com';
      break;
    case 'Microsoft':
      issuerStr = 'live.com';
      break;
    case 'Discord':
      issuerStr = 'discordapp.com';
      break;
    default:
      issuerStr = '';
      break;
  }

  if (issuerStr) {
    if (hostnameReversedArray.join('.').indexOf(issuerStr.split('.').reverse().join('.')) === 0) {
      return true;
    } else {
      return false;
    }
  } else {
    if (hostnameReversedArray.findIndex(e => e === issuer) >= 0) {
      return true;
    } else {
      return false;
    }
  }
}
const isContainerMatched = function (account, tab) {
  if (!account && tab === 'firefox-default') {
    return true;
  }
  if (account === tab) {
    return true;
  }
  return false;
}
const popupSearchInput = document.querySelector('#popupSearchInput');
const otpContainer = new (ef.t`
>div.container
  >div.columns
    +otppoint
  >div.column.col-12.mt-1
`)()
const template_totp = ef.t`
>div.column.col-12.mt-1.account-item
  #data-issuer = {{issuer}}
  #data-container-name = {{container}}
  >div.card.popup-card
    >div.popup-header.popup-text
      >span.fl
        .{{issuer}}
      >span.fr
        #style = color:{{containerColorCode}}
        .{{container}}
    >div.popup-content
      >div.popup-row
        >div.popup-left
          >img.popup-icon.issuer-icon
            #onerror = iconOnError(this)
            #src = ../icons/service/{{issuerIcon}}.svg
        >div.popup-row-item
          >a
            #class = {{otpKeyClassName}}
            #href = /options/tokens.html?index={{index}}
            #target = _blank
            .{{OTP}}
        >div.popup-right.container-icon-box
          #data-color = {{containerColor}}
          >img.popup-icon.container-icon
            #style = display:{{containerIconDisplay}}
            #onerror = containerIconOnError(this)
            #src = {{containerIcon}}
    >progress.progress
      #max={{progress_max}}
      %value={{progress}}
`
otpContainer.$mount({ target: document.getElementById('otpContainer'), option: 'replace' })
var otpStoreInterval = []
function addOTP(issuer, containerObj = {}, key, expiry = 30, code_length = 6, option = {}) {
  var otpKey;
  var otpKeyClassName = 'popup-link';
  try {
    otpKey = KeyUtilities.generate(OTPType.totp, key, code_length, expiry);
  } catch (error) {
    console.error(error);
    otpKey = 'ERROR';
    otpKeyClassName = 'popup-link-error'
  }
  var id = otpContainer.otppoint.push(new template_totp({
    $data: {
      i18n_Copy: 'Copy',
      i18n_Edit: 'Edit',
      OTP: otpKey,
      issuer: issuer,
      issuerIcon: serviceIconNames.find(e => getSvgNameByIssuer(issuer).indexOf(e) >= 0) || 'fallback',
      otpKeyClassName: otpKeyClassName,
      container: containerObj.name,
      containerIcon: containerObj.iconUrl,
      containerIconDisplay: containerObj.iconUrl ? 'block' : 'none',
      containerColorCode: containerObj.colorCode,
      containerColor: containerObj.color,
      progress_max: expiry,
      progress: expiry - (Math.round(new Date().getTime() / 1000.0) % expiry),
      index: option.index
    }
  })) - 1;
  if (otpKey !== 'ERROR') {
    otpStoreInterval.push(setInterval(function () {
      otpContainer.otppoint[id].$data.OTP = KeyUtilities.generate(1, key, code_length, expiry)
      otpContainer.otppoint[id].$data.progress = expiry - (Math.round(new Date().getTime() / 1000.0) % expiry)
    }, 500))
  }
}
function clearOTP() {
  for (id in otpStoreInterval) {
    clearInterval(otpStoreInterval[id])
  }
  otpContainer.otppoint.empty()
  otpStoreInterval.empty()
}


function initSearch() {
  let timer = null;
  function debounce(func, wait) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      func();
      timer = null;
    }, wait);
  }
  const handleSearch = function () {
    const keyword = (popupSearchInput.value.trim() || '').toLowerCase();
    const domList = document.querySelectorAll('.account-item');
    [...domList].forEach(e => {
      const data = e.dataset;
      if ([data.issuer, data.containerName].some(str => str.toLowerCase().indexOf(keyword) >= 0)) {
        e.style.display = 'block';
      } else {
        e.style.display = 'none';
      }
    })
  }
  popupSearchInput.addEventListener('input', e => {
    debounce(handleSearch, 300)
  })
}

function autoFillButtonInit() {
  document.querySelector('#autofillOTPForm').addEventListener('click', async () => {
    const tabInfo = await browser.tabs.query({ active: true });
    browser.tabs.executeScript(
      tabInfo[0].id,
      {
        file: '/scripts/manualCopy.js'
      }
    )
  });
}

(async function () {
  const passwordInfo = await getPasswordInfo();
  if (passwordInfo.isEncrypted && !passwordInfo.password) {
    const errorDom = document.createElement('div');
    errorDom.setAttribute('class', 'popup-error');
    errorDom.innerText = 'ENCRYPTED OR ERROR';
    document.body.appendChild(errorDom);
    return;
  }

  const accountInfosPromise = getAccountInfos();
  const contextualIdentitiesPromise = browser.contextualIdentities.query({});
  const tabInfoPromise = browser.tabs.query({ active: true });
  const accountInfos = await accountInfosPromise;
  const contextualIdentities = await contextualIdentitiesPromise;
  const tabInfo = (await tabInfoPromise)[0];
  if (!accountInfos || !accountInfos.length) {
    const emptyDom = document.createElement('div');
    emptyDom.setAttribute('class', 'popup-empty');
    emptyDom.innerHTML = '<img src="../icons/options/starfleet.svg"/><div>Live long and prosper</div>';
    document.body.appendChild(emptyDom);
    return;
  }
  let filteredAccountInfos = accountInfos.filter(e =>
    isIssuerMatchedUrl(e.localIssuer, tabInfo.url) && isContainerMatched(e.containerAssign, tabInfo.cookieStoreId)
  );
  if (filteredAccountInfos.length === 0) {
    filteredAccountInfos = accountInfos;
  }
  filteredAccountInfos.forEach((e, i) => {
    addOTP(
      e.localIssuer,
      contextualIdentities.find(el => el.cookieStoreId === e.containerAssign),
      e.localSecretToken,
      e.localOTPPeriod,
      e.localOTPDigits,
      {
        index: i,
      }
    )
  });

  initSearch();
  autoFillButtonInit();
})();

document.getElementById("popupClearSearch").addEventListener("click", clearSearch);

function clearSearch () {
  clearPopupSearch = document.querySelector('[name=popupSearch]')
  clearPopupSearch.value = ""
};