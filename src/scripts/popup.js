import './dependency/ef.min.js';
import './dependency/jsOTP.min.js';
import './scanQR.js';
import { KeyUtilities, OTPType } from './dependency/key-utilities.js';
import getServiceIconNames from './serviceIcon.js';
import { getPasswordInfo, getAccountInfos } from './accountInfo.js';
import * as i18n from './i18n.js';

i18n.render();

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
    case 'NutStore':
    case '坚果云':
      return 'nutstore';
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
    if (hostnameReversedArray.findIndex(e => e === issuer.toLowerCase()) >= 0) {
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

const isVisible = function (elem) {
  return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
};
const toggleAccountsLess = document.querySelector('.toggleAccounts[data-type=less]');
const toggleAccountsMore = document.querySelector('.toggleAccounts[data-type=more]');
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
  #data-flag = {{flag}}
  >div.card.popup-card
    >div.popup-header.popup-text
      >span.fl
        .{{issuer}}
      >span.fr
        #style = color:{{containerColorCode}}
        .{{container}}
    >div.popup-content
      >div.popup-row
        >a.popup-left
          #href = /options/tokens.html?index={{index}}
          #target = _blank
          >img.popup-icon.issuer-icon
            #onerror = iconOnError(this)
            #src = ../icons/service/{{issuerIcon}}.svg
        >div.popup-row-item
          >span
            #href = javascript:void(0);
            #class = {{otpKeyClassName}}
            .{{OTP}}
        >div.popup-row-item
          >i.popup-icon.icon-copy
            @click.stop = copyOtp
          -copySuccessMessage
        >div.popup-right.container-icon-box
          #style = display:{{containerIconDisplay}}
          #data-color = {{containerColor}}
          >img.popup-icon.container-icon
            #style = fill:{{containerColorCode}}
            #onerror = containerIconOnError(this)
            #src = {{containerIcon}}
    >progress.progress
      #max={{progress_max}}
      %value={{progress}}
`
const template_copy_success = ef.t`
>div.copy-success-message
  #style = {{ style }}
  @animationend.stop = onAnimationEnd
  >svg
    #xmlns = http://www.w3.org/2000/svg
    #version = 1.2
    #viewBox = 0 0 16 20
    >path.checkmark
      #d = M2 10 L 6 14 14 4
  >span
    .{{copiedMessage}}
`;

function getOtpType(issuer) {
  if (/steam/i.test(issuer)) {
    return OTPType.steam;
  } else {
    return OTPType.totp;
  }
}

otpContainer.$mount({ target: document.getElementById('otpContainer'), option: 'replace' })
var otpStoreInterval = []
function addOTP(issuer, containerObj = {}, key, expiry = 30, code_length = 6, option = {}) {
  var otpKey;
  var otpKeyClassName = 'popup-link';
  try {
    otpKey = KeyUtilities.generate(getOtpType(issuer), key, code_length, expiry);
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
      index: option.index,
      flag: option.flag,
    },
    $methods: {
      copyOtp({ state, e }) {
        navigator
          .clipboard
          .writeText(state.$data.OTP)
          .then(() => {
            const { parentNode } = e.target;
            mountCopySuccessMessage(state, parentNode);
          });
      }
    }
  })) - 1;
  if (otpKey !== 'ERROR') {
    otpStoreInterval.push(setInterval(function () {
      otpContainer.otppoint[id].$data.OTP = KeyUtilities.generate(getOtpType(issuer), key, code_length, expiry)
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

const handleListItemFilter = function () {
  const isMore = isVisible(toggleAccountsLess) || (!isVisible(toggleAccountsLess) && !isVisible(toggleAccountsMore));
  const keyword = (popupSearchInput.value.trim() || '').toLowerCase();
  const domList = document.querySelectorAll('.account-item');
  [...domList].forEach(e => {
    const data = e.dataset;
    if (
      [data.issuer, data.containerName].some(str => str.toLowerCase().indexOf(keyword) >= 0)
      &&
      (isMore || data.flag === 'matched')
    ) {
      e.style.display = 'block';
    } else {
      e.style.display = 'none';
    }
  })
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
  popupSearchInput.addEventListener('input', e => {
    debounce(handleListItemFilter, 300)
  })
}

function initMoreOrLess() {
  toggleAccountsLess.addEventListener('click', e => {
    toggleAccountsLess.style.display = 'none';
    toggleAccountsMore.style.display = 'block';
    handleListItemFilter();
  });
  toggleAccountsMore.addEventListener('click', e => {
    toggleAccountsLess.style.display = 'block';
    toggleAccountsMore.style.display = 'none';
    handleListItemFilter();
  });
}

function autoFillButtonInit() {
  document.getElementById('autofillOTPForm').addEventListener('click', async () => {
    const tabInfo = await browser.tabs.query({ active: true })
    await browser.tabs.executeScript(
      tabInfo[0].id,
      {
        file: '/scripts/content/manualCopy.js'
      }
    )
    if (/android/i.test(navigator.userAgent)) {
      const tabs = await browser.tabs.query({})
      const tab = tabs.find((tab) => tab.url.indexOf('popup.html') >= 0)
      if (tab) {
        browser.tabs.remove(tab.id)
      }
    }
  });
}

function otpKeyClickInit() {
  document.querySelector('body').addEventListener('click', async (event) => {
    const e = event.target;
    if (!([...document.querySelectorAll('.popup-row-item>span')].some(el => el === e))) {
      return;
    }
    if (!e.innerText) {
      return;
    }
    await browser.storage.local.set({
      tempKey: e.innerText,
    });

    const tabInfo = await browser.tabs.query({ active: true })
    await browser.tabs.executeScript(
      tabInfo[0].id,
      {
        file: '/scripts/content/fillKey.js'
      }
    );
    await browser.storage.local.remove('tempKey');

    if (/android/i.test(navigator.userAgent)) {
      const tabs = await browser.tabs.query({})
      const tab = tabs.find((tab) => tab.url.indexOf('popup.html') >= 0)
      if (tab) {
        browser.tabs.remove(tab.id)
      }
    }

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
  let hasMatch = false;
  accountInfos.forEach((e, i) => {
    const isMatch = isIssuerMatchedUrl(e.localIssuer, tabInfo.url) && isContainerMatched(e.containerAssign, tabInfo.cookieStoreId);
    if (isMatch) {
      hasMatch = true;
    }
    addOTP(
      e.localIssuer,
      contextualIdentities.find(el => el.cookieStoreId === e.containerAssign),
      e.localSecretToken,
      e.localOTPPeriod,
      e.localOTPDigits,
      {
        index: i,
        flag: isMatch ? 'matched' : 'other',
      }
    )
  })
  if (hasMatch && !(accountInfos.length === 1)) {
    toggleAccountsMore.style.display = 'block';
    [...document.querySelectorAll('.account-item[data-flag=other]')].forEach(e => {
      e.style.display = 'none';
    });
    initMoreOrLess();
  } else {
    toggleAccountsMore.style.display = 'none';
  }

  initSearch();
  autoFillButtonInit();
  otpKeyClickInit();
})();

document.getElementById("popupClearSearch").addEventListener("click", clearSearch);

function clearSearch() {
  const clearPopupSearch = document.querySelector('[name=popupSearch]')
  clearPopupSearch.value = ""
  const event = new Event('input')
  popupSearchInput.dispatchEvent(event)
};

function mountCopySuccessMessage(component, rowItem) {
  if (component.copySuccessMessage) {
    return;
  }

  const { top } = rowItem.getBoundingClientRect();
  component.copySuccessMessage = new template_copy_success({
    $data: {
      style: top > 28 ? 'top: -28px;' : 'top: calc(100% + 4px);',
      copiedMessage: i18n.getMessage('popup_otp_copied')
    },
    $methods: {
      onAnimationEnd({ e, state }) {
        if (e.target === state.$element) {
          state.$umount();
        }
      }
    }
  });
}

window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.documentElement.scrollTop > 100) {
    document.getElementById("btnToTop").style.display = "block";
  } else {
    document.getElementById("btnToTop").style.display = "none";
  }
}

function topFunction() {
  document.documentElement.scrollTop = 0;
} 

document.getElementById("btnToTop").addEventListener("click", topFunction);