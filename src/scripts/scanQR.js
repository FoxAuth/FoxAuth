
document.getElementById('scanQRPopup').addEventListener('click', e => {
  // show waiting overlay
  document.body.classList.add('scanning')
  
  browser.tabs.captureTab().then(dataURL => {
    QrScanner.scanImage(dataURL)
      .then(result => {
        // validate and parse URL
        const otpInfo = urlOtpauth.parse(result)
        const params = new URLSearchParams(otpInfo)
        browser.tabs.create({
          url: `otpinfo.html?${params.toString()}`
        })
      })
      .catch(error => {
        alert(error || 'No QR code found.')
      })
      // Promise.prototype.finally require Firefox 58
      .finally(() => {
        document.body.classList.remove('scanning')
      })
  })
})
