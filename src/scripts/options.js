import './menu.js';
import * as i18n from './i18n.js';

i18n.render();

const colorInput = document.getElementById("badgeColor")

async function getSettings() {
  const obj = await browser.storage.local.get('settings');
  const { settings } = obj;
  return settings || {};
}

function saveSettings(obj) {
  browser.storage.local.set({
    settings: obj
  });
}

function saveColor(color) {
  let settings = {};
  settings.color = color;
  browser.storage.local.set({settings});
  colorInput.value = color;
}

function handleChange() {
  let color = colorInput.value;
  saveColor(color);
  browser.browserAction.setBadgeBackgroundColor({color: color});
}

window.addEventListener('DOMContentLoaded', (event) => {
  browser.storage.local.get('settings').then(obj => {
    if (obj.settings.color) {
      let color = obj.settings.color;
      colorInput.value = color;
    }
  })
});

colorInput.addEventListener('change', handleChange);

colorInput.addEventListener('change', handleChange);

function toggleContextMenu(isAble) {
  if (isAble) {
    browser.contextMenus.remove('autfillOTP');
  } else {
    browser.contextMenus.create({
      id: "autfillOTP",
      title: "Autofill OTP code",
      contexts: ["editable"],
      icons: {
        "16": "../icons/icon.svg",
        "32": "../icons/icon.svg"
      }
    });
  }
}

document.querySelectorAll('.settings-checkbox').forEach(el => el.addEventListener('change', async e => {
  const settings = await getSettings();
  if (e.target.dataset.key) {
    saveSettings({
      ...settings,
      [e.target.dataset.key]: e.target.checked,
    });
    if (e.target.dataset.key === 'disableContext') {
      toggleContextMenu(e.target.checked);
    }
  }
}));



function checkAndroidBrowser() {
  const u = navigator.userAgent;
  const isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1;
  if (!isAndroid) {
    return;
  }
  const dom = document.querySelector('#context');
  colorInput.disabled = 'disabled';
  dom.checked = 'checked';
  dom.disabled = 'disabled';
}

(async function () {
  const settings = await getSettings();
  for (const key in settings) {
    if (settings.hasOwnProperty(key)) {
      const checkboxDom = document.querySelector('.settings-checkbox[data-key="' + key + '"]');
      if (checkboxDom) {
        checkboxDom.checked = settings[key];
      }
    }
  };
  checkAndroidBrowser();
})();