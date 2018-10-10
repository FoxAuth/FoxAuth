
//delete OTP form
document.body.addEventListener("click", (e) => {
  const t = e.target;
  if (!t.classList || !t.classList.contains('deleteOTP')) {
      return;
  }
  const node = t.parentNode.parentNode.parentNode;
  if(window.confirm("Delete these account info doesn't disable account 2FA for you. Make sure you won't be locked out before proceed.")){
    node.parentNode.removeChild(node);
  }
});
