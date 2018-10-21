const serviceIconNames = getServiceIconNames();
const iconOnError = function (e) {
  console.log('icon', e);
  e.src = '../icons/service/fallback.svg';
}
const containerIconOnError = function (e) {
  console.log('container', e);
  console.log(e.parentNode);
  e.parentNode.removeChild(e);
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
        #style = color:{{containerColor}}
        .{{container}}
    >div.popup-content
      >div.popup-row
        >div.popup-left
          >img.popup-icon.issuer-icon
            #onerror = iconOnError(this)
            #src = ../icons/service/{{issuerIcon}}.svg
        >div.popup-row-item
          >a.popup-link
            #href = /options/tokens.html?index={{index}}
            #target = _blank
            .{{OTP}}
        >div.popup-right
          >img.popup-icon
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
  var totp = new jsOTP.totp(expiry, code_length)
  var id = otpContainer.otppoint.push(new template_totp({
    $data: {
      i18n_Copy: 'Copy',
      i18n_Edit: 'Edit',
      OTP: totp.getOtp(key),
      issuer: issuer,
      issuerIcon: serviceIconNames.find(e => issuer.toLowerCase().indexOf(e) >= 0 ) || 'fallback',
      container: containerObj.name,
      containerIcon: containerObj.iconUrl,
      containerIconDisplay: containerObj.iconUrl? 'block': 'none',
      containerColor: containerObj.colorCode,
      progress_max: expiry,
      progress: expiry - (Math.round(new Date().getTime() / 1000.0) % expiry),
      index: option.index
    }
  })) - 1
  otpStoreInterval.push(setInterval(function () {
    otpContainer.otppoint[id].$data.OTP = totp.getOtp(key)
    otpContainer.otppoint[id].$data.progress = expiry - (Math.round(new Date().getTime() / 1000.0) % expiry)
  }, 500))
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

(async function () {
  const accountInfosPromise = getAccountInfos();
  const contextualIdentitiesPromise = browser.contextualIdentities.query({});
  const accountInfos = await accountInfosPromise;
  const contextualIdentities = await contextualIdentitiesPromise;
  accountInfos.forEach((e, i) => {
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
})();
