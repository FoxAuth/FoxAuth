
document.getElementById('scanQRPopup').addEventListener('click', e => {
  // @TODO show waiting overlay here

  
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
  })
})
