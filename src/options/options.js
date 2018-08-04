'use strict';

// Must not be null...
var browser = browser || null;
var mdui = mdui || null;

const _M = browser.i18n.getMessage;
const _L = console.log;

var $$ = mdui.JQ;

// This page is for
// + Import/Export settings
// + Encrypted import export
// + No autofill blacklist
// + DropBox WebDav Backup

$$('#title').text(_M('extName'));

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

// Setup tooltips
new mdui.Tooltip('#title', _Tip('Version'));
new mdui.Tooltip('#export', _Tip('ImportExport'));
new mdui.Tooltip('#backup', _Tip('Backup'));
new mdui.Tooltip('#crypt', _Tip('Crypt'));
new mdui.Tooltip('#theme', _Tip('Theme'));

// Should use dark style from 19:00 to 6:00
function shouldApplyDarkStyle() {
    let conf = localStorage['night'];
    if (conf != null) {
        if (conf == false.toString())
            return false;
        else return true;
    }
    let dh = new Date();
    let nightBegin = localStorage['nightBegin'] || 19;
    let nightEnd = localStorage['nightEnd'] || 6;
    return dh.getHours() >= nightBegin && dh.getHours() <= 24 || dh.getHours() <= nightEnd;
}
const MDUI_DARK_CLASS = 'mdui-theme-layout-dark';

// Call this to apply dark style automatically
function autodark() {
    let body = mdui.JQ('body')[0];
    let cls = body.classList;
    if (shouldApplyDarkStyle())
        cls.add(MDUI_DARK_CLASS);
    else
        cls.remove(MDUI_DARK_CLASS);
}

// Bind translations
$$('#it').text(_M('ImportExport'));
$$('#et').text(_M('Crypt'));
$$('#at').text(_M('Blacklist'));
$$('#wt').text(_M('WebDavExport'));
$$('#qt').text(_M('exportQROrText'));

$$('#is').text(_M('DescImportExport'));
$$('#es').text(_M('DescCryptoImportExport'));
$$('#as').text(_M('DescBlacklist'));
$$('#ws').text(_M('DescWebDav'));
$$('#qs').text(_M('DescExportQROrText'));

$$('#ii').text(_M('doImport'));
$$('#ie').text(_M('doExport'));
$$('#ei').text(_M('doImport'));
$$('#ee').text(_M('doExport'));
$$('#ac').text(_M('doConfig'));
$$('#wi').text(_M('doImport'));
$$('#we').text(_M('doExport'));
$$('#qi').text(_M('doExportQR'));
$$('#qe').text(_M('doExportText'));

$$('#tsetup').text(_M('ThemeSetup'));
$$('#ttheme').text(_M('Theme'));
$$('#tprimary').text(_M('ThemePrimary'));
$$('#taccent').text(_M('ThemeSecoundary'));
$$('#tdefault').text(_M('RestoreDefault'));

autodark();

// importExport menu
function ieM(selector) {
    _L('Run ieM');
    return;
}

// importExport
function importExport(_import) {
    _L('Run importExport');
    return false;
}

// encrypt ie menu
function eM(selector) {
    _L('Run eM');
    return;
}

// encrypted import export
function encrypted(_import) {
    _L('Run encrypted importExport');
    return false;
}

// blacklist options
function blackOptions() {
    _L('Run options blacklist');
    return false;
}

// backup menu
function bM(selector) {
    _L('Run backup menu');
    return;
}

// run backup rescue
function backup(_import) {
    _L('Run backup');
    return false;
}

// run export QR
function eqr() {
    _L('Export QR');
    return false;
}

// run export Text
function et() {
    _L('Export Text');
    return false;
}

/**
 * Add onclick listener
 *
 * @param {String} selector CSS selector
 * @param {Function} fun function to execute when clicked
 */
function _K(selector, fun) {
    return $$(selector).on('click', fun);
}

/**
 * Wrap a one-arity function to zero-arity function
 *
 * @param {Function} fun wrapped function
 * @param {Object} saved_arg1 arg1 to pass
 */
function _S(fun, saved_arg1) {
    return (function () {
        return fun(saved_arg1);
    });
}

// Bind events
var bML = _S(bM, '#backup');
var eML = _S(eM, '#crypt');
var ieML = _S(ieM, '#export');

_K('#export', ieML);
_K('#backup', bML);
_K('#crypt', eML);

_K('#ii', _S(importExport, true));
_K('#ie', _S(importExport, false));
_K('#ei', _S(encrypted, true));
_K('#ee', _S(encrypted, false));
_K('#ac', blackOptions);
_K('#wi', _S(backup, true));
_K('#we', _S(backup, false));

_K('#qi', eqr);
_K('#qe', et);

// MDUI code

_K('#theme', () => new mdui.Dialog('#dialog-theme', {}).open());
