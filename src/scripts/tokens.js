;
//delete OTP form
(function () {
  const warningMsg = document.querySelector('.warningMsg');
  const warningMsgCloseBtn = warningMsg.querySelector('.warningMsgCloseBtn');
  const warningMsgBtn = warningMsg.querySelector('.warningMsgBtn');
  const tokenSearch = document.querySelector('[name=popupSearch]');
  const formBox = document.getElementById('otpFormBox');
  const warningCover = document.querySelector('.warning-cover');
  const defaultAccountInfoForm = formBox.children[0];
  const debounce = (func, wait) => {
    let timer = null;
    return function () {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        func();
        timer = null;
      }, wait);
    }
  };
  const applyBatchUpdate = debounce(() => {
    // save to storage
    updateInfos(cachedAccountInfos, accountInfoUpdateRecord);
    accountInfoUpdateRecord = [];
  }, 100);
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
    warningCover.style.display = 'block';
    confirmFun = function () {
      const event = document.createEvent('HTMLEvents');
      event.initEvent('click', true, false);
      warningMsgCloseBtn.dispatchEvent(event);
      // and other operations
      const index = findIndex(formBox.children, node);
      removeInfo(cachedAccountInfos, index);
      if (tokenSearch.value.length > 0) {
        // need re search
        handleSearch();
      }
    }
    warningCloseFun = function () {
      warningMsgBtn.removeEventListener('click', confirmFun);
      warningMsgCloseBtn.removeEventListener('click', warningCloseFun);
      warningMsg.style.display = 'none';
      warningMsg.style.opacity = '0';
      warningCover.style.display = 'none';
    }
    warningMsgBtn.addEventListener('click', confirmFun);
    warningMsgCloseBtn.addEventListener('click', warningCloseFun);

  });

  const valueChangeHandler = (event) => {
    const { target } = event;
    if (
      (target.nodeName === 'INPUT' && event.type === 'input') ||
      (target.nodeName === 'SELECT' && event.type === 'change')
    ) {
      // record which info are updated
      let { value } = target;
      if (target.name !== 'localSecretToken') {
        value = value.trim();
      }
      if (target.name !== 'localSecretToken') value = value.trim();
      accountInfoUpdateRecord.push({
        index: findIndex(formBox.children, target.form),
        change: {
          [target.name]: value
        }
      });
      applyBatchUpdate();
    }
  };
  formBox.addEventListener('input', valueChangeHandler);
  formBox.addEventListener('change', valueChangeHandler);
  tokenSearch.addEventListener('input', (event) => {
    handleSearch();
  });
  browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes.accountInfos) {
      const newValue = await getAccountInfos();
      cachedAccountInfos = newValue;
      if (cachedAccountInfos.length === 0) {
        cachedAccountInfos = [getDefaultAccountInfo()];
      }
      updateAllInfoForm(formBox, {
        infos: cachedAccountInfos,
        defaultAccountInfoForm,
      });
    } else if ((changes.isEncrypted && changes.isEncrypted.newValue !== false) || changes.passwordInfo) {
      checkPasswordInfo();
    }
  });
  window.addEventListener('storage', () => {
    checkPasswordInfo();
  });
  document.getElementById('tokenClearSearch').addEventListener('click', () => {
    tokenSearch.value = '';
    handleSearch();
  })

  init();
  async function init() {
    tokenSearch.value = '';
    const infos = await getAccountInfos();
    await initBrowserContainers();
    // make sure default form has default value
    updateInfoForm(defaultAccountInfoForm, {
      info: getDefaultAccountInfo(),
      containers: getBrowserContainers()
    });
    if (infos.length > 0) {
      cachedAccountInfos = infos;
    } else {
      // give some samples
      cachedAccountInfos = [getDefaultAccountInfo()];
    }
    const forms = generateInfoFormList(cachedAccountInfos, getBrowserContainers());
    htmlBrandNewChildren(formBox, forms);

    setForHightlight();
    checkPasswordInfo();
  }

  function getQueryString(name) {
    const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    const r = window.location.search.substr(1).match(reg);
    if (r != null) {
      return unescape(r[2]);
    }
    return null;
  }
  function setForHightlight() {
    const index = getQueryString('index');
    if (index === null) {
      return;
    }
    const activeDom = document.querySelectorAll('form.localOTP')[+index];
    scrollTo(0, activeDom.getBoundingClientRect().top - 70);
    activeDom.classList.add('active');
    setTimeout(() => {
      activeDom.classList.remove('active');
    }, 3000);
  }

  function generateInfoFormList(accountInfos, containers) {
    return accountInfos.map((info) => {
      const form = defaultAccountInfoForm.cloneNode(true);
      updateInfoForm(form, {
        info,
        containers
      });
      return form;
    });
  }
  function updateAllInfoForm(formBox, {
    infos, defaultAccountInfoForm
  }) {
    const { children } = formBox;
    let { length } = children;
    const { length: newLength } = infos;
    const count = newLength - length;
    if (count > 0) {
      const array = [];
      for(let i = 0; i < count; i++) {
        array.push(defaultAccountInfoForm.cloneNode(true));
      }
      formBox.append(...array);
    } else if (count < 0) {
      removeChildren(formBox, 'fromLast', Math.abs(count));
    }

    for (let i = 0; i < newLength; i++) {
      updateInfoForm(children[i], { info: infos[i] });
    }
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
    if (index < 0) return;
    infos.splice(index, 1);
    saveAccountInfos(infos);
  }
  function updateInfos(infos, records) {
    records.forEach((record) => {
      if (record.index >= 0) {
        if (shouldUpdateInfo(infos, record)) {
          infos.splice(record.index, 1, {
            ...(infos[record.index]),
            ...(record.change)
          });
        }
      }
    });
    saveAccountInfos(infos);
  }
  // should update info?
  function shouldUpdateInfo(infos, record) {
    if (record.change.localIssuer || record.change.containerAssign) {
      const nextInfo = {
        ...(infos[record.index]),
        ...(record.change)
      };
      if (findIndexOfSameAccountInfo(
        // do not compare self
        infos.filter((_, index) => index !== record.index),
        nextInfo
      ) < 0
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
  // search account info by issuers, containers name or account name
  function searchAccountInfos(keyword, infos) {
    if (keyword === '') return infos;
    const lowerCaseKeyword = (keyword||'').toLowerCase();
    return infos.map(
      (info) => info.localIssuer.toLowerCase().indexOf(lowerCaseKeyword) >= 0 ||
        info.localAccountName.toLowerCase().indexOf(lowerCaseKeyword) >= 0 ||
        isContainerMatchKeyword(lowerCaseKeyword, info.containerAssign)
    );
  }
  // search container name
  function isContainerMatchKeyword(keyword, containerId) {
    const browserContainers = getBrowserContainers();
    for (const container of browserContainers) {
      if (container.cookieStoreId === containerId) {
        if (container.name.toLowerCase().indexOf(keyword) >= 0) {
          return true;
        }
      }
    }
    return false;
  }
  // handle search for issuers, containers name or account name
  const handleSearch = debounce(() => {
    const result = searchAccountInfos(tokenSearch.value.trim(), cachedAccountInfos);
    const { children } = formBox;
    const { length } = children;
    for(let i = 0; i < length; i++) {
      if (result[i]) {
        children[i].style.display = 'inline-block';
      } else {
        children[i].style.display = 'none';
      }
    }
  }, 200);
  async function checkPasswordInfo() {
    const passwordInfo = await getPasswordInfo();
    if (passwordInfo.isEncrypted && (!passwordInfo.password || !passwordInfo.encryptIV)) {
      setFormSecureInputStatus(formBox.children, 'disable');
    } else {
      setFormSecureInputStatus(formBox.children, 'enable');
    }
  }
  function setFormSecureInputStatus(formList, status) {
    const { length } = formList;
    for (let i = 0; i < length; i++) {
      const form = formList[i];
      ['localAccountName', 'localSecretToken', 'localRecovery'].forEach(
        (fName) => {
          const element = form.querySelector(`[name=${fName}]`);
          if (element) {
            if (status === 'disable') {
              element.setAttribute('disabled', '');
            } else {
              element.removeAttribute('disabled');
            }
          }
        }
      )
    }
  }

})();

document.getElementById("tokenClearSearch").addEventListener("click", clearSearch);

function clearSearch () {
  clearPopupSearch = document.querySelector('[name=popupSearch]')
  clearPopupSearch.value = ""
};