//toggle checkbox
[...document.getElementsByClassName('ulPass')].forEach(ul => {
  const applyNest = p => {
    if (!p) return;
    const parent = p.querySelector('input[type=checkbox]');
    const cp = p.querySelector('ul');
    if (cp) {
      const children = cp.children;
      parent.addEventListener('input', () => {
        [...children].forEach(e => {
          const i = e.querySelector('input[type=checkbox]');
          if (i) i.disabled = !parent.checked;
        });
      });
      [...children].forEach(applyNest);
    }
  };
  [...ul.children].forEach(applyNest);
});

//msgDismiss
// document.getElementsByClassName("syncbtn").addEventListener("click", () => {
//   document.getElementsByClassName("genericMsg").removeAttribute("display: none")
// });

//import handling
// var fileSelect = document.getElementById("operatebtn"),
//   fileElem = document.getElementById("fileElem");

// fileSelect.addEventListener("click", function (e) {
//   if (fileElem) {
//     fileElem.click();
//   }
//   e.preventDefault();
// }, false);

const encryptForm = document.getElementById('encryptForm');
const passwordInput = document.getElementById('encryptPass');
const reconfirmInput = document.getElementById('reconfirmPass');
const confirmBtn = document.getElementById('confirmBtn');
const decryptBtn = document.getElementById('decryptBtn');
const forgetBtn = document.getElementById('forgetBtn');
const radioList = document.getElementsByName('rememPass');
const dropboxBtn = document.getElementsByClassName('syncbtn')[0];
const dropboxTextElement = dropboxBtn.getElementsByClassName('syncBtnText')[0];
const warningMsgDiv = document.querySelector('.warningMsg');
const warningMsgContent = warningMsgDiv.querySelector('.warningMsgContent');
const warningConfirmBtn = warningMsgDiv.querySelector('.warningMsgBtn');
const warningCloseBtn = warningMsgDiv.querySelector('.warningMsgCloseBtn');
const errorMsgDiv = document.querySelector('.errorMsg');
const errorMsgContent = errorMsgDiv.querySelector('.errorMsgContent');
const errorConfirmBtn = errorMsgDiv.querySelector('.errorMsgBtn');
const errorCloseBtn = errorMsgDiv.querySelector('.errorMsgCloseBtn');
const shadowCover = document.querySelector('.warning-cover');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('fileElem');

const openMessage = (function() {
  let zIndex = 11;
  return function ({
    message = '',
    confirmBtn,
    confirmBtnText = '',
    container,
    confrimCallback = () => {},
    cancelBtn,
    cancelCallback = () => {},
    contentElement,
  }) {
    // message
    contentElement.textContent = message || 'Oops!';
    // cancel
    const cancelFunc = (type) => {
      container.style.opacity = 0;
      if (type !== 'close') {
        cancelCallback();
      }
      cancelBtn.removeEventListener('click', cancelFunc);
      setTimeout(() => {
        container.style.display = 'none';
      }, 300);
    };
    cancelBtn.addEventListener('click', cancelFunc);
    // confirm
    if (confirmBtnText === '') {
      confirmBtn.style.display = 'none';
      setTimeout(() => cancelFunc('close'), 3650);
    } else {
      confirmBtn.style.display = 'block';
      const confirmFunc = () => {
        confrimCallback();
        confirmBtn.removeEventListener('click', confirmFunc);
        cancelFunc('close');
      };
      confirmBtn.addEventListener('click', confirmFunc);
    }
    container.style.zIndex = zIndex++;
    container.style.display = 'flex';
    container.style.opacity = 1;
  };
})();

function showWarningMessage({
  message = 'Warning oops!',
  confirmBtnText = ''
}) {
  return new Promise((resolve, reject) => {
    openMessage({
      message,
      confirmBtn: warningConfirmBtn,
      confirmBtnText,
      container: warningMsgDiv,
      confrimCallback: () => resolve(1),
      cancelBtn: warningCloseBtn,
      cancelCallback: () => resolve(0),
      contentElement: warningMsgContent,
    });
  });
}
function showErrorMessage({
  message = 'Error oops!',
  confirmBtnText = ''
}) {
  return new Promise((resolve, reject) => {
    openMessage({
      message,
      confirmBtn: errorConfirmBtn,
      confirmBtnText,
      container: errorMsgDiv,
      confrimCallback: () => resolve(1),
      cancelBtn: errorCloseBtn,
      cancelCallback: () => resolve(0),
      contentElement: errorMsgContent,
    });
  });
}
const dropboxHelper = new DropboxHelper({
  warning: showWarningMessage,
  error: showErrorMessage
});

const doResetAccountInfos = lockAsyncFunc(
  async (nextStorageArea, nextPassword) => {
    const infos = await getAccountInfos();
    const prevPasswordInfo = await getPasswordInfo();
    await browser.storage.local.remove('passwordInfo');
    sessionStorage.removeItem('passwordInfo');
    // if user forget previous password, use previous encryptIV
    await savePasswordInfo({
      isEncrypted: true,
      nextStorageArea,
      nextPassword,
      nextEncryptIV: prevPasswordInfo.isEncrypted ? prevPasswordInfo.encryptIV : window.crypto.getRandomValues(new Uint8Array(12))
    })
    // if user forget previous password, don't encrypt it again
    if ((!prevPasswordInfo.isEncrypted) || (prevPasswordInfo.password && prevPasswordInfo.encryptIV)) {
      await saveAccountInfos(infos);
    }
  }
);
const doForgetPassword = lockAsyncFunc(
  async () => {
    const passwordInfo = await getPasswordInfo();
    await savePasswordInfo({
      isEncrypted: true,
      nextStorageArea: passwordInfo.storageArea,
      nextPassword: '',
      nextEncryptIV: passwordInfo.encryptIV
    });
    await setForgetBtnStatus();
  }
)

dropboxBtn.addEventListener('click', async () => {
  if (dropboxHelper.authState === 'unauthorized') {
    dropboxHelper.authorize(() => {
      setDropboxText();
    });
  } else {
    await dropboxHelper.disconnect();
    setDropboxText();
  }
});
passwordInput.addEventListener('input', () => {
  setConfirmBtnStatus();
  setDecryptBtnStatus();
});
reconfirmInput.addEventListener('input', () => {
  setConfirmBtnStatus();
  setDecryptBtnStatus();
});
decryptBtn.addEventListener('click', async (event) => {
  event.preventDefault();
  const { value: passwordOne } = passwordInput;
  const { value: passwordTwo } = reconfirmInput;
  if (
    passwordOne.length > 0 &&
    passwordTwo.length > 0 &&
    passwordOne === passwordTwo
  ) {
    try {
      let infos = await getInfosFromLocal();
      const passwordInfo = await getPasswordInfo();
      infos = await decryptAccountInfos(infos, {
        encryptPassword: passwordOne,
        encryptIV: passwordInfo.encryptIV
      });
      await browser.storage.local.remove(['isEncrypted', 'passwordInfo']);
      sessionStorage.removeItem('passwordInfo');
      saveAccountInfos(infos);
      passwordInput.value = '';
      reconfirmInput.value = '';
      setConfirmBtnStatus();
      setForgetBtnStatus();
      setDecryptBtnStatus();
    } catch (error) {
      console.log(error);
      showErrorMessage({
        message: 'Wrong password'
      });  
    }
  } else {
    showErrorMessage({
      message: 'Please input the same password twice'
    });
  }
})
forgetBtn.addEventListener('click', (event) => {
  event.preventDefault();
  doForgetPassword();
});
encryptForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const { value: passwordOne } = passwordInput;
  const { value: passwordTwo } = reconfirmInput;
  if (
    passwordOne.length > 0 &&
    passwordTwo.length > 0 &&
    passwordOne === passwordTwo
  ) {
    try {
      await doResetAccountInfos(getCheckedRadioValue(radioList), passwordOne);
      passwordInput.value = '';
      reconfirmInput.value = '';
      setConfirmBtnStatus();
      setForgetBtnStatus();
      setDecryptBtnStatus();
    } catch (error) {
      showErrorMessage({
        message: 'Error occurred during encrypting/decrypting'
      });  
    }
  } else {
    showErrorMessage({
      message: 'Please input the same password twice'
    });
  }
});
exportBtn.addEventListener('click', async () => {
  const data = await browser.storage.local.get();
  const str = JSON.stringify(data);
  const dataURL = `data:application/json;charset=utf-8,${encodeURIComponent(str)}`;
  const anchor = document.createElement('a');
  anchor.download = 'Foxauth_export.json';
  anchor.href = dataURL;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  requestAnimationFrame(() => {
    anchor.click();
    requestAnimationFrame(() => {
      document.body.removeChild(anchor);
    });
  });
});
importBtn.addEventListener('click', (event) => {
  event.preventDefault();
  browser.tabs.create({
    url: '/options/about.html'
  });
});
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (!changes.accountInfos) return;
  dropboxHelper.sync();
});
init();

async function init() {
  const storageArea = await getPasswordStorageArea();
  checkRadioByValue(radioList, storageArea);
  setConfirmBtnStatus();
  setForgetBtnStatus();
  setDecryptBtnStatus();
  await dropboxHelper.init();
  setDropboxText();
}
function forEach(arrayLike, func) {
  if (arrayLike && arrayLike.length > 0) {
    const { length } = arrayLike;
    for(let i = 0; i < length; i++) {
      if (func(arrayLike[i], i, arrayLike) === false) {
        break;
      }
    }
  }
}
function findBy(arrayLike, func) {
  let index = -1;
  forEach(arrayLike, (item, iter, array) => {
    if (func(item, iter, array)) {
      index = iter;
      return false;
    }
  });
  if (index >= 0) {
    return arrayLike[index];
  } else {
    return undefined;
  }
}
function setConfirmBtnStatus() {
  if (passwordInput.value && reconfirmInput.value && passwordInput.value == reconfirmInput.value) {
    confirmBtn.removeAttribute('disabled');
  } else {
    confirmBtn.setAttribute('disabled', 'true');
  }
}
function getCheckedRadioValue(radioList) {
  const radio = findBy(radioList, (radio) => radio.checked);
  if (radio) {
    return radio.value;
  } else {
    return undefined;
  }
}
function checkRadioByValue(radioList, value) {
  forEach(radioList, (radio) => {
    if (radio.value === value) {
      radio.checked = true;
      return false;
    } else {
      radio.checked = false;
    }
  });
}
async function setForgetBtnStatus() {
  const passwordInfo = await getPasswordInfo();
  if (passwordInfo.isEncrypted && passwordInfo.password && passwordInfo.encryptIV) {
    forgetBtn.removeAttribute('disabled');
  } else {
    forgetBtn.setAttribute('disabled', 'true');
  }
}
async function setDecryptBtnStatus() {
  if (passwordInput.value && reconfirmInput.value && passwordInput.value == reconfirmInput.value) {
    decryptBtn.removeAttribute('disabled');
  } else {
    decryptBtn.setAttribute('disabled', 'true');
  }
}
function setDropboxText() {
  if (dropboxHelper.authState === 'authorized') {
    dropboxTextElement.textContent = 'Disconnect';
  } else {
    dropboxTextElement.textContent = 'Dropbox';
  }

}
