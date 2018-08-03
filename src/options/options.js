const _M = browser.i18n.getMessage;
const _L = console.log;

var $$ = mdui.JQ;

// This page is for
// + Import/Export settings
// + Encryption setup
// + No autofill blacklist
// + DropBox WebDav Backup

$$('#title').text(_M('extName'));

function _C(m) {
    return {
        content: m
    }
}

// Setup tooltips
new mdui.Tooltip('#title', _C(_M('Version')));
