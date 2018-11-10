import QrScanner from './dependency/qr-scanner.min.js';
import doScanQR from './doScanQR.js';

const webcamBox = document.querySelector('.webcam-box')
const webcamClose = document.querySelector('.webcam-close')

async function androidCamera() {
  // camera scan
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: {
        exact: 'environment'
      }
    }
  })
  webcamBox.style.display = 'block'
  const video = document.createElement('video')
  video.classList.add('webcam-record')
  video.srcObject = stream
  webcamBox.appendChild(video)
  video.play()
  const closeFunc = () => {
    video.pause()
    const tracks = stream.getTracks();
    tracks.forEach(function (track) {
      track.stop();
    });
    video.srcObject = null
    webcamBox.removeChild(video)
    webcamBox.style.display = 'none'
    webcamClose.removeEventListener('click', closeFunc)
  }
  webcamClose.addEventListener('click', closeFunc)
  new QrScanner(video, async (result) => {
    closeFunc()
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
}
document.getElementById('scanQRPopup').addEventListener('click', async (e) => {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) {
    androidCamera()
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
