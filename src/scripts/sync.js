import './menu.js';
import './formAction.js';
import lockAsyncFunc from './lockAsyncFunc.js';
import {
  getPasswordInfo,
  savePasswordInfo,
  getAccountInfos,
  saveAccountInfos,
  getInfosFromLocal,
  decryptAccountInfos,
  getPasswordStorageArea,
} from './accountInfo.js';
import { debounce } from './utils.js';
import * as i18n from './i18n.js';
import QualityEstimation from './QualityEstimation.js';

i18n.render();

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
const strengthProgress = document.getElementById('strengthProgress');
const scoreNum = document.getElementById('scoreNum');

function progressColor(colors, progress) {
  const level = Math.floor(progress);
  const startColorRgb = colors[Math.max(0, Math.min(level, colors.length - 1))]
  const endColorRgb = colors[Math.max(0, Math.min(level + 1, colors.length - 1))]
  const current = progress - level;
  return 'rgb(' +
    (startColorRgb[0] - (startColorRgb[0] - endColorRgb[0]) * current) + ',' +
    (startColorRgb[1] - (startColorRgb[1] - endColorRgb[1]) * current) + ',' +
    (startColorRgb[2] - (startColorRgb[2] - endColorRgb[2]) * current) + ')'
}

function calPassScore(){
  let score = QualityEstimation(passwordInput.value);
  if (score === "Matched"){
    score = 0;
    showWarningMessage({message: i18n.getMessage('sync_password_alert')});
  }
  let colorProgress = score < 64 && score / 64 ||
    score < 80 && 1 + (score - 64) / (80 - 64) ||
    score < 112 && 2 + (score - 80) / (112 - 80) ||
    score < 128 && 3 + (score - 112) / (128 - 112) ||
    4;
  strengthProgress.style.backgroundColor  = progressColor([
      [244, 67, 54],
      [255, 152, 0],
      [255, 235, 59],
      [205, 220, 57],
      [76, 175, 80]
    ], colorProgress)
  
  strengthProgress.style.width = (score/128)*100 + "%";
  scoreNum.innerText = score;
}

passwordInput.addEventListener('keyup', debounce(calPassScore, {
  wait: 100,
  trailing: true,
  head: false,
}));
passwordInput.addEventListener('change', debounce(calPassScore, {
  wait: 100,
  trailing: true,
  head: false,
}));

function resetProgress() {
  scoreNum.innerText = 0;
  strengthProgress.style.width = 0;
}

confirmBtn.addEventListener('click', resetProgress);
decryptBtn.addEventListener('click', resetProgress);

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
        shadowCover.style.display = 'none';
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
      shadowCover.style.display = 'block';
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
      nextEncryptIV: prevPasswordInfo.encryptIV ? prevPasswordInfo.encryptIV : window.crypto.getRandomValues(new Uint8Array(12))
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

browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'showOverwriteWarning') {
    return showOverwriteWarning(message.warningType, message.driveType, message.localAndRemoteData);
  }
});

dropboxBtn.addEventListener('click', async () => {
  const authState = await browser.runtime.sendMessage({
    id: 'dropbox',
    dropbox: {
      id: 'getAuthState'
    }
  });
  if (authState === 'unauthorized') {
    await browser.runtime.sendMessage({
      id: 'dropbox',
      dropbox: {
        id: 'authorize'
      }
    });
    setDropboxText('authorized');
  } else {
    await browser.runtime.sendMessage({
      id: 'dropbox',
      dropbox: {
        id: 'disconnect'
      }
    });
    setDropboxText('unauthorized');
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
        message: i18n.getMessage('sync_wrong_password')
      });  
    }
  } else {
    showErrorMessage({
      message: i18n.getMessage('sync_not_the_same_password')
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
        message: i18n.getMessage('sync_encrypt_decrypt_error')
      });  
    }
  } else {
    showErrorMessage({
      message: i18n.getMessage('sync_not_the_same_password')
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
    url: '/options/import.html'
  });
});
init();

async function init() {
  const storageArea = await getPasswordStorageArea();
  checkRadioByValue(radioList, storageArea);
  setConfirmBtnStatus();
  setForgetBtnStatus();
  setDecryptBtnStatus();
  try {
    const authState = await browser.runtime.sendMessage({
      id: 'dropbox',
      dropbox: {
        id: 'getAuthState'
      }
    });
    setDropboxText(authState);
  } catch (error) {
    showErrorMessage({
      message: error.message
    });
  }
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
  const passwordInfo = await getPasswordInfo();
  if (
    passwordInfo.isEncrypted &&
    passwordInput.value &&
    reconfirmInput.value &&
    passwordInput.value == reconfirmInput.value
  ) {
    decryptBtn.removeAttribute('disabled');
  } else {
    decryptBtn.setAttribute('disabled', 'true');
  }
}
function setDropboxText(authState) {
  if (authState === 'authorized') {
    dropboxTextElement.textContent = i18n.getMessage('sync_disconnect');
  } else {
    dropboxTextElement.textContent = 'Dropbox';
  }
}

async function showOverwriteWarning(
  warningType,
  driveType,
  {remoteVersion, localVersion, localData, remoteData}
) {
  if (!warningType) return;

  const overwirteLocalWarning = () => showWarningMessage({
    message: i18n.getMessage('sync_overwite_local_warning'),
    confirmBtnText: i18n.getMessage('confirm')
  });
  const overwirteRemoteWarning = () => showWarningMessage({
    message: i18n.getMessage('sync_overwite_remote_warning'),
    confirmBtnText: i18n.getMessage('confirm')
  });
  let result = 0;
  if (warningType === 'overwriteRemote') {
    result = await overwirteRemoteWarning()
  } else {
    result = await overwirteLocalWarning();
  }
  if (!result) return;
  if (driveType === 'dropbox') {
    browser.runtime.sendMessage({
      id: 'dropbox',
      dropbox: {
        id: 'doDiffAndPatch',
        remoteVersion,
        localVersion,
        localData,
        remoteData
      }
    });
  }
}
