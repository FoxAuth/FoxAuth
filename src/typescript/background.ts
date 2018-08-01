declare var require: NodeRequire;
const mdui = require('../libs/mdui.min.js');
const $$ = mdui.JQ;

document.onclick = () => mdui.alert('Foooooo');

console.log(browser.i18n.getMessage("extName") + ': Plugin Hello');
