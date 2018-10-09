
document.getElementById('scanQRPopup').addEventListener('click', e => {
  // @TODO show waiting overlay here

  
  browser.tabs.captureTab().then(dataURL => {
    QrScanner.scanImage(dataURL)
      .then(result => {
        // @TODO parse OTP here
        // @example OTP result
        // otpauth://totp/testuser@security-totp.appspot.com?secret=DTVXIP2E4QREBVASTAK3M3JWPBUVODJP

        
        // open new tab to add OTP
        const params = new URLSearchParams()
        params.set('key', 'JBSWY3DPEHPK3PXR')
        params.set('username', 'test')
        params.set('url', 'example.com/7')
        browser.tabs.create({
          url: `otpinfo.html?${params.toString()}`
        })
      })
      .catch(error => {
        alert(error || 'No QR code found.')
    })
  })
})
