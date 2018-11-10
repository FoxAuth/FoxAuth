(async function () {
  const { tempKey } = await browser.storage.local.get('tempKey') || {};
  if (!tempKey) {
    return;
  }
  const dom = ([...document.querySelectorAll('input[type=text],input[type=tel],input[type=number]')].filter(isVisible) || [])[0];
  if (dom) {
    dom.value = tempKey;
  }
})();