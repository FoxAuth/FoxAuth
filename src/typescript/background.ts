declare var require: any;

const mdui = require('../libs/mdui.min.js');
const $$ = mdui.JQ;

document.onclick = () => mdui.alert('Foooooo');
