'use strict';

var browser = browser || null;
var mdui = mdui || null;

const _M = browser.i18n.getMessage;
const _L = console.log;

var $$ = mdui.JQ;

// This page is for
// + OTP Client
// + Accounts list
// + Go to options
// + Autofill blacklist website (moved to options menu)
// + QR share (moved to options menu)
// + Manual share (moved to options menu) / import

/**
 * Make a excited chain call function
 *
 * @param {Function} fn function to 2nd chain call
 * @param {Function} inner fuction to 1st chain call
 */
function chian(fn, inner) {
    return ((o) => {
        return fn(inner(o));
    });
}

/**
 * Make a mdui tip content object
 *
 * @param {String} m message
 */
function _C(m) {
    return {
        content: m
    };
}

let _Tip = chian(_C, _M);

// Add account manually
function addAccount() {
    _L('Add account');
    return false;
}

// on copy account 2fa code
function onAccountClick(id) {
    _L('Click: ' + id);
    return false;
}

// Setup tooltips
new mdui.Tooltip('#setup', _Tip('Options'));
new mdui.Tooltip('#add', _Tip('ManualImport'));

// Setup events
$$('#setup').on('click', () => {
    browser.tabs.create({
        url: browser.extension.getURL('options/options.html')
    }); // Ignore errors
});
$$('#add').on('click', addAccount);
