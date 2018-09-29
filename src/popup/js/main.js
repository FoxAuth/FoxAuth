const mbody = new (ef.t`
>body
  >header.navbar
    >section.navbar-section
      >button.btn.btn-link
        @click = add_new
        .{{i18n_add_new_totp}}
    >section.navbar-center
    >section.navbar-section
  >div.container
    >div.columns
      +otppoint
    >div.column.col-12.mt-1
`)({
    $methods: {
        add_new ({state}) {
            var newcode = prompt(browser.i18n.getMessage('Add_New'), '')
            if (newcode !== null) {
                //TODO
            }
        }
    },
    $data: {
        i18n_add_new_totp: browser.i18n.getMessage('Add_New_TOTP')
    }
})
const template_totp = ef.t`
>div.column.col-11.mt-1
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
mbody.$mount({target: document.body, option: 'replace'})
var otpStoreInterval = []

function addOTP(url, user,key, expiry = 30, code_length = 6) {
    var totp = new jsOTP.totp(expiry, code_length)
    var id = mbody.otppoint.push(new template_totp({$data: {
        i18n_Copy: browser.i18n.getMessage('Copy'),
        i18n_Edit: browser.i18n.getMessage('Edit'),
        OTP: totp.getOtp(key),
        URL: url,
        USER: user,
        progress_max: expiry,
        progress: expiry - (Math.round(new Date().getTime() / 1000.0) % expiry)
    }})) - 1
    otpStoreInterval.push(setInterval(function() {
        mbody.otppoint[id].$data.OTP = totp.getOtp(key)
        mbody.otppoint[id].$data.progress = expiry - (Math.round(new Date().getTime() / 1000.0) % expiry)
    }, 500))
}

function clearOTP() {
  for (id in otpStoreInterval) {
    clearInterval(otpStoreInterval[id])
  }
  mbody.otppoint.empty()
  otpStoreInterval.empty()
}

addOTP('example.com/1', 'Example1','JBSWY3DPEHPK3PXP')
addOTP('example.com/2', 'Example2','JBSWY3DPEHPK3PXA')
addOTP('example.com/3', 'Example3','JBSWY3DPEHPK3PXE', 60)
addOTP('example.com/4', 'Example4','JBSWY3DPEHPK3PXZ', 30, 8)
addOTP('example.com/5', 'Example5','JBSWY3DPEHPK3PXH')
addOTP('example.com/6', 'Example6','JBSWY3DPEHPK3PXQ')

new Clipboard('.btncopy')