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
const doResetAccountInfos = lockAsyncFunc(
  async (nextStorageArea, nextPassword) => {
    const infos = await getAccountInfos();
    await browser.storage.local.remove('passwordInfo');
    sessionStorage.removeItem('passwordInfo');
    const settingsData = await browser.storage.local.get({
      settings: {}
    });
    const settings = settingsData.settings;
    await savePasswordInfo(nextStorageArea, {
      nextPassword,
      nextEncryptIV: window.crypto.getRandomValues(new Uint8Array(12))
    })
    await browser.storage.local.set({
      settings: {
        ...settings,
        passwordStorage: nextStorageArea
      },
      isEncrypted: true,
    });
    await saveAccountInfos(infos);
    passwordInput.value = '';
    reconfirmInput.value = '';
    setConfirmBtnStatus();
  }
);
const doForgetPassword = lockAsyncFunc(
  async () => {
    const storageArea = await getPasswordStorageArea();
    await savePasswordInfo(storageArea, {
      nextPassword: '',
      nextEncryptIV: null
    });
    await setForgetBtnStatus();
  }
)

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
encryptForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const { value: passwordOne } = passwordInput;
  const { value: passwordTwo } = reconfirmInput;
  if (
    passwordOne.length > 0 &&
    passwordTwo.length > 0 &&
    passwordOne === passwordTwo
  ) {
    doResetAccountInfos(getCheckedRadioValue(radioList), passwordOne);
  }
});
init();

async function init() {
  const storageArea = await getPasswordStorageArea();
  checkRadioByValue(radioList, storageArea);
  setConfirmBtnStatus();
  setForgetBtnStatus();
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
