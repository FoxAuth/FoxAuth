const iconOnError = function(e){
  e.src = '../icons/service/fallback.svg';
}
const otpContainer = new (ef.t`
>div.container
  >div.columns
    +otppoint
  >div.column.col-12.mt-1
`)()
const template_totp = ef.t`
>div.column.col-12.mt-1
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
            #src = ../icons/service/{{issuerLowerCase}}.svg
        >div.popup-row-item
          .{{OTP}}
        >div.popup-right
          >img.popup-icon
            #src = {{containerIcon}}
    >progress.progress
      #max={{progress_max}}
      %value={{progress}}
`
otpContainer.$mount({target: document.getElementById('otpContainer'), option: 'replace'})
var otpStoreInterval = []
function addOTP(issuer, containerObj, key, expiry = 30, code_length = 6) {
    var totp = new jsOTP.totp(expiry, code_length)
    var id = otpContainer.otppoint.push(new template_totp({$data: {
        i18n_Copy: 'Copy',
        i18n_Edit: 'Edit',
        OTP: totp.getOtp(key),
        issuer: issuer,
        issuerLowerCase: issuer.toLowerCase(),
        container: containerObj.name,
        containerIcon: containerObj.iconUrl,
        containerColor: containerObj.colorCode,
        progress_max: expiry,
        progress: expiry - (Math.round(new Date().getTime() / 1000.0) % expiry)
    }})) - 1
    otpStoreInterval.push(setInterval(function() {
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
addOTP('GitHub', {
  colorCode: "#ff9f00",
  iconUrl: "resource://usercontext-content/briefcase.svg",
  name: "Work"
},'JBSWY3DPEHPK3PXP')
addOTP('discord', {
  colorCode: "#37adff",
  iconUrl: "resource://usercontext-content/fingerprint.svg",
  name: "Personal"
},'JBSWY3DPEHPK3PXE', 60)
addOTP('gmail', {
  colorCode: "#51cd00",
  iconUrl: "resource://usercontext-content/dollar.svg",
  name: "Banking"
},'JBSWY3DPEHPK3PXZ', 30, 8);
addOTP('nsths', {
  colorCode: "#51cd00",
  iconUrl: "resource://usercontext-content/dollar.svg",
  name: "Banking"
},'JBSWY3DPEHPK3PXZ', 30, 8);
