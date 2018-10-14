const otpContainer = new (ef.t`
>div.container
  >div.columns
    +otppoint
  >div.column.col-12.mt-1
`)()
const template_totp = ef.t`
>div.column.col-12.mt-1
  >div.card
    >div
      >div.float-left
        >div.btn
          .{{i18n_Edit}}
      >div.float-right
        >div.btn.btncopy
          #data-clipboard-action = copy
          #data-clipboard-text = {{OTP}}
          .{{i18n_Copy}}
    >div.header.h3.text-center.pt-1
      .{{OTP}}
    >div.card-body.text-gray
      .{{URL}}
      >div.float-right
        .{{USER}}
    >progress.progress
      #max={{progress_max}}
      %value={{progress}}
`
otpContainer.$mount({target: document.getElementById('otpContainer'), option: 'replace'})
var otpStoreInterval = []
function addOTP(url, user,key, expiry = 30, code_length = 6) {
    var totp = new jsOTP.totp(expiry, code_length)
    var id = otpContainer.otppoint.push(new template_totp({$data: {
        i18n_Copy: 'Copy',
        i18n_Edit: 'Edit',
        OTP: totp.getOtp(key),
        URL: url,
        USER: user,
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
addOTP('example.com/1', 'Example1','JBSWY3DPEHPK3PXP')
addOTP('example.com/3', 'Example3','JBSWY3DPEHPK3PXE', 60)
addOTP('example.com/4', 'Example4','JBSWY3DPEHPK3PXZ', 30, 8)