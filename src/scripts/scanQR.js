
document.getElementById('scanQRPopup').addEventListener('click', e => {
  // @TODO show waiting overlay here

  
  browser.tabs.captureTab().then(dataURL => {
    QrScanner.scanImage(dataURL)
      .then(result => {
        browser.tabs.create({
          url: `otpinfo.html?${encodeURIComponent(result)}`
        })
      })
      .catch(error => {
        alert(error || 'No QR code found.')
    })
  })
})
