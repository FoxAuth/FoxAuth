(async function(){
  const key = await getTotpKey();
  const dom = ([...document.querySelectorAll('input[type=text],input[type=tel],input[type=number]')].filter(isVisible)||[])[0];
  if(dom){
    dom.value = key;
  }
})();
