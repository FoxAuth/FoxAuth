;
//delete OTP form
(function () {
  const warningMsg = document.querySelector('.warningMsg');
  const warningMsgCloseBtn = warningMsg.querySelector('.warningMsgCloseBtn');
  const warningMsgBtn = warningMsg.querySelector('.warningMsgBtn');
  let confirmFun = function () { };
  let cachedAccountInfos = [];
  const formBox = document.getElementById('otpFormBox');
  const defaultAccountInfoForm = formBox.children[0];

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
      const index = findIndex(formBox.children, node);
      removeInfo(cachedAccountInfos, index);
      if (cachedAccountInfos.length > 1) {
        node.parentNode.removeChild(node);
      } else {
        updateInfoForm(node, cachedAccountInfos[0]);
      }
      const event = document.createEvent('HTMLEvents');
      event.initEvent('click', true, false);
      warningMsgCloseBtn.dispatchEvent(event);
      // and other operations
    }
    warningMsgBtn.addEventListener('click', confirmFun);

  });

  initInfos();
  async function initInfos() {
    const infos = await getInfosFromLocal();
    if (infos.length > 0) {
      cachedAccountInfos = infos;
    } else {
      // give some samples
      cachedAccountInfos = [getRefreshAccountInfo()];
      saveInfosToLocal(cachedAccountInfos);
    }
    const newNode = defaultAccountInfoForm.cloneNode(true);
    updateInfoForm(newNode, cachedAccountInfos[0]);
    formBox.replaceChild(newNode, defaultAccountInfoForm);
    formBox.appendChild(generateInfosFragment(cachedAccountInfos.slice(1)));
  }
  async function getInfosFromLocal() {
    const obj = await browser.storage.local.get('accountInfos');
    const { accountInfos } = obj;
    return Array.isArray(accountInfos) ? accountInfos : [];
  }
  function saveInfosToLocal(infos) {
    browser.storage.local.set({
      accountInfos: infos
    });
  }
  function getRefreshAccountInfo() {
    return {
      containerAssign: 'none',
      localIssuer: '',
      localAccountName: '',
      localSecretToken: '',
      localRecovery: '',
      localOTPType: 'Time based',
      localOTPAlgorithm: 'SHA-1',
      localOTPPeriod: '30',
      localOTPDigits: '6'
    };
  }
  function updateInfoForm(form, info) {
    Object.keys(info).forEach((key) => {
      const element = form.querySelector(`[name=${key}]`);
      if (element) {
        element.value = info[key];
      }
    });
  }
  function generateInfosFragment(accountInfos) {
    return accountInfos.reduce((fragment, info) => {
      const form = defaultAccountInfoForm.cloneNode(true);
      updateInfoForm(form, info);
      fragment.appendChild(form);
      return fragment;
    }, document.createDocumentFragment());
  }
  function findIndex(arrayLike, item) {
    if (!arrayLike || arrayLike.length <= 0) {
      return -1;
    } else {
      const length = arrayLike.length;
      for (let i = 0; i < length; i++) {
        if (arrayLike[i] === item) return i;
      }
      return -1;
    }
  }
  function removeInfo(infos, index) {
    if (infos.length > 1) {
      infos.splice(index, 1);
    } else {
      infos.splice(0, 1, getRefreshAccountInfo());
    }
    saveInfosToLocal(infos);
  }
})();

