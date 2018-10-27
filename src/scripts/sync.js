//toggle checkbox
[...document.getElementsByClassName('ulPass')].forEach(ul => {
  const applyNest = p => {
    if (!p) return;
    const parent = p.querySelector('input[type=checkbox]');
    const cp = p.querySelector('ul');
    console.log(parent, cp);
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
const forgetBtn = document.getElementById('forgetBtn');
const radioList = document.getElementsByName('rememPass');
const dropboxBtn = document.getElementsByClassName('syncbtn')[0];
const dropboxTextElement = dropboxBtn.getElementsByClassName('syncBtnText')[0];
const dropboxHelper = new DropboxHelper();
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
});
reconfirmInput.addEventListener('input', () => {
  setConfirmBtnStatus();
});
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
    await doResetAccountInfos(getCheckedRadioValue(radioList), passwordOne);
    passwordInput.value = '';
    reconfirmInput.value = '';
    setConfirmBtnStatus();
    setForgetBtnStatus();
  }
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
  if (passwordInput.value == reconfirmInput.value) {
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
    forgetBtn.removeAttribute('disabled')
  } else {
    forgetBtn.setAttribute('disabled', 'true');
  }
}
function setDropboxText() {
  if (dropboxHelper.authState === 'authorized') {
    dropboxTextElement.textContent = 'Disconnect';
  } else {
    dropboxTextElement.textContent = 'Dropbox';
  }
}
