;
//delete OTP form
(function () {
  const warningMsg = document.querySelector('.warningMsg');
  const warningMsgCloseBtn = warningMsg.querySelector('.warningMsgCloseBtn');
  const warningMsgBtn = warningMsg.querySelector('.warningMsgBtn');
  let confirmFun = function () { };

  warningMsgCloseBtn.addEventListener('click', function () {
    warningMsgBtn.removeEventListener('click', confirmFun);
    warningMsg.style.display = 'none';
    warningMsg.style.opacity = '0';
  });
  document.body.addEventListener("click", function (e) {
    const t = e.target;
    if (!t.classList || !t.classList.contains('deleteOTP')) {
      return;
    }
    const node = t.parentNode.parentNode.parentNode;
    warningMsg.style.display = 'flex';
    warningMsg.style.opacity = '1';
    confirmFun = function () {
      node.parentNode.removeChild(node);
      console.log('mmm', Math.random());
      const event = document.createEvent('HTMLEvents');
      event.initEvent('click', true, false);
      warningMsgCloseBtn.dispatchEvent(event);
      // and other operations
    }
    warningMsgBtn.addEventListener('click', confirmFun);

  });

})();

