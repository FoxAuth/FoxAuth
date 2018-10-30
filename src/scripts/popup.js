const serviceIconNames = getServiceIconNames();
const iconOnError = function (e) {
  e.src = '../icons/service/fallback.svg';
}
const containerIconOnError = function (e) {
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
        #style = color:{{containerColorCode}}
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
  var totp = new jsOTP.totp(expiry, code_length)
  key = base32tohex(key)
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
      containerColorCode: containerObj.colorCode,
      containerColor: containerObj.color,
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

function autoFillButtonInit(){
  document.querySelector('#autofillOTPForm').addEventListener('click',async ()=>{
    const tabInfo = await browser.tabs.query({ active: true });
    browser.tabs.executeScript(
      tabInfo[0].id,
      {
        file: '/scripts/manualCopy.js'
      }
    )
  });
}

// see https://tools.ietf.org/html/rfc4648#section-6 and https://github.com/Authenticator-Extension/Authenticator/commit/c6d85480d719a9de5bb7d21808e8172b205cfb63
function base32tohex(base32) {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  let hex = '';
  let padding = 0;

  for (let i = 0; i < base32.length; i++) {
    if (base32.charAt(i) === '=') {
      bits += '00000';
      padding++;
    } else {
      let val = base32chars.indexOf(base32.charAt(i).toUpperCase());
      val = val.toString(2).padStart(5, '0');
      bits += val;
    }
  }
  for (let i = 0; i + 4 <= bits.length; i += 4) {
    const chunk = bits.substr(i, 4);
    hex = hex + Number(`0b${chunk}`).toString(16);
  }
  switch (padding) {
    case 0:
      break;
    case 6:
      hex = hex.substr(0, hex.length - 8);
      break;
    case 4:
      hex = hex.substr(0, hex.length - 6);
      break;
    case 3:
      hex = hex.substr(0, hex.length - 4);
      break;
    case 1:
      hex = hex.substr(0, hex.length - 2);
      break;
    default:
      throw new Error('Invalid Base32 string');
  }
  return hex;
}

(async function () {
    const passwordInfo = await getPasswordInfo();
    if(passwordInfo.isEncrypted && !passwordInfo.password) {
      const errorDom = document.createElement('div');
      errorDom.setAttribute('class', 'popup-error');
      errorDom.innerText = 'ENCRYPTED OR ERROR';
      document.body.appendChild(errorDom);
      return;
    }
    
    const accountInfosPromise = getAccountInfos();
    const contextualIdentitiesPromise = browser.contextualIdentities.query({});
    const accountInfos = await accountInfosPromise;
    const contextualIdentities = await contextualIdentitiesPromise;
    if(!accountInfos || !accountInfos.length) {
      const emptyDom = document.createElement('div');
      emptyDom.setAttribute('class', 'popup-empty');
      emptyDom.innerHTML='<img src="../icons/options/starfleet.svg"/><div>Live long and prosper</div>';
      document.body.appendChild(emptyDom);
      return;
    }
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
    autoFillButtonInit();
})();
