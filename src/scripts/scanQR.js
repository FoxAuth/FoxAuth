import { scanVideo } from './dependency/jsQRWrap.js';
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
  video.width = 320;
  video.height = 320;
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
  webcamClose.addEventListener('click', closeFunc);
  const recursiveScan = async () => {
    try {
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(recursiveScan);
        return;
      }
      const result = await scanVideo(video);
      if (!result) {
        requestAnimationFrame(recursiveScan);
        return;
      }
      closeFunc();
      const otpInfo = urlOtpauth.parse(result)
      otpInfo.container = ''
      const params = new URLSearchParams(otpInfo)
      browser.tabs.create({
        url: `/options/otpinfo.html?${params.toString()}`
      }) 
    } catch (error) {
      alert(error || 'Invalid QR code');
    }
  }
  recursiveScan();
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
