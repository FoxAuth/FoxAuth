;
//delete OTP form
(function () {
  const warningMsg = document.querySelector('.warningMsg');
  const warningMsgCloseBtn = warningMsg.querySelector('.warningMsgCloseBtn');
  const warningMsgBtn = warningMsg.querySelector('.warningMsgBtn');
  const formBox = document.getElementById('otpFormBox');
  const defaultAccountInfoForm = formBox.children[0];
  let confirmFun = function () { };
  let warningCloseFun = function () { };
  let cachedAccountInfos = [];
  let accountInfoUpdateRecord = [];

  document.body.addEventListener("click", function (e) {
    const t = e.target;
    if (!t.classList || !t.classList.contains('deleteOTP')) {
      return;
    }
    e.preventDefault();
    const node = t.parentNode.parentNode.parentNode;
    warningMsg.style.display = 'flex';
    warningMsg.style.opacity = '1';
    hideFormDeleteBtn(node);
    confirmFun = function () {
      const event = document.createEvent('HTMLEvents');
      event.initEvent('click', true, false);
      warningMsgCloseBtn.dispatchEvent(event);
      // and other operations
      const index = findIndex(formBox.children, node);
      const { length } = cachedAccountInfos;
      removeInfo(cachedAccountInfos, index);
      if (length > 1) {
        node.parentNode.removeChild(node);
      } else {
        updateInfoForm(node, cachedAccountInfos[0]);
      }
    }
    warningCloseFun = function () {
      warningMsgBtn.removeEventListener('click', confirmFun);
      warningMsgCloseBtn.removeEventListener('click', warningCloseFun);
      warningMsg.style.display = 'none';
      warningMsg.style.opacity = '0';
      showFormDeleteBtn(node);
    }
    warningMsgBtn.addEventListener('click', confirmFun);
    warningMsgCloseBtn.addEventListener('click', warningCloseFun);

  });
  const valueChangeHandler = (event) => {
    const { target } = event;
    if (
      (target.nodeName === 'INPUT' && event.type === 'input') ||
      target.nodeName === 'SELECT'
    ) {
      // record which info are updated
      let { value } = target;
      if (target.name !== 'localSecretToken') value = value.trim();
      accountInfoUpdateRecord.push({
        index: findIndex(formBox.children, target.form),
        change: {
          [target.name]: value
        }
      });
      debounce(() => {
        const { form } = target;
        if (!form) {
          return;
        }
        // save to storage
        updateInfos(cachedAccountInfos, accountInfoUpdateRecord);
        accountInfoUpdateRecord = [];
      }, 100);
    }
  };
  formBox.addEventListener('input', valueChangeHandler);
  formBox.addEventListener('change', valueChangeHandler);

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
  let timer = null;
  function debounce(func, wait) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      func();
      timer = null;
    }, wait);
  }
  function updateInfos(infos, records) {
    records.forEach((record) => {
      if (record.index >= 0) {
        infos.splice(record.index, 1, {
          ...(infos[record.index]),
          ...(record.change)
        });
      }
    });
    saveInfosToLocal(infos);
  }
  function setFormDeleteBtnDisplay(form, display) {
    const elements = form.parentNode.children;
    for (const elem of elements) {
      elem.querySelector('.deleteOTP').style.display = display;
    }
  }
  function showFormDeleteBtn(form) {
    setFormDeleteBtnDisplay(form, 'block');
  }
  function hideFormDeleteBtn(form) {
    setFormDeleteBtnDisplay(form, 'none');
  }

})();

