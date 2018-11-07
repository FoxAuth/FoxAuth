
document.getElementById('scanQRPopup').addEventListener('click', async (e) => {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) {
    // camera scan
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: {
          exact: 'environment'
        }
      }
    })
    const video = document.createElement('video')
    video.classList.add('scan-preview')
    video.srcObject = stream
    document.body.appendChild(video)
    video.play()
    new QrScanner(video, async (result) => {
      video.pause()
      const tracks = stream.getTracks();
      tracks.forEach(function(track) {
        track.stop();
      });
      video.srcObject = null
      document.body.removeChild(video)

      try {
        const otpInfo = urlOtpauth.parse(result)
        otpInfo.container = ''
        const params = new URLSearchParams(otpInfo)
        browser.tabs.create({
          url: `/options/otpinfo.html?${params.toString()}`
        })
      } catch (error) {
        alert(error || 'No QR code found.')  
      }
    }, 400)
  } else {
    // show waiting overlay
    document.body.classList.add('scanning')
    try {
      await doScanQR();
    } catch (error) {
      alert(error || 'No QR code found.')
    } finally {
      document.body.classList.remove('scanning')
    }
  }
})
