console.log('manual copy run');
(async function(){
  const key = await getTotpKey();
  console.log('manual run key', key);
  console.log('isvisible', isVisible);
  console.log('233');
  const dom = ([...document.querySelectorAll('input[type=text],input[type=tel],input[type=number]')].filter(isVisible)||[])[0];
  if(dom){
    dom.value = key;
  }
})();