
document.getElementById('scanQRPopup').addEventListener('click', async (e) => {
  // show waiting overlay
  document.body.classList.add('scanning')
  try {
    await doScanQR();
  } catch (error) {
    alert(error || 'No QR code found.');
  } finally {
    document.body.classList.remove('scanning')
  }
})
