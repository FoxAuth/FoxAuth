"use strict";

const _M = browser.i18n.getMessage;
const _L = console.log;

var $$ = mdui.JQ;

// This page is for
// + Import/Export settings
// + Encryption setup
// + No autofill blacklist
// + DropBox WebDav Backup

$$('#title').text(_M('extName'));

function chian(fn, inner) {
    return (function (o) {
        return fn(inner(o));
    });
}

function _C(m) {
    return {
        content: m
    }
}

var _Tip = chian(_C, _M);

// Setup tooltips
new mdui.Tooltip('#title', _Tip('Version'));
new mdui.Tooltip('#export', _Tip('ImportExport'));
new mdui.Tooltip('#backup', _Tip('Backup'));
new mdui.Tooltip('#crypt', _Tip('Crypt'));

// should use dark style from 19:00 to 6:00
function shouldApplyDarkStyle() {
    var conf = localStorage['night'];
    if (conf != null) {
        if (conf == false.toString())
            return false;
        else return true;
    }
    var dh = new Date();
    var nightBegin = localStorage['nightBegin'] || 19;
    var nightEnd = localStorage['nightEnd'] || 6;
    return dh.getHours() >= nightBegin && dh.getHours() <= 24 || dh.getHours() <= nightEnd;
}
const MDUI_DARK_CLASS = 'mdui-theme-layout-dark';

// call this to apply dark style automatically
function autodark() {
    var body = mdui.JQ('body')[0];
    var cls = body.classList;
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

$$('#is').text(_M('DescImportExport'));
$$('#es').text(_M('DescCryptoImportExport'));
$$('#as').text(_M('DescBlacklist'));
$$('#ws').text(_M('DescWebDav'));

$$('#ii').text(_M('doImport'));
$$('#ie').text(_M('doExport'));
$$('#ei').text(_M('doImport'));
$$('#ee').text(_M('doExport'));
$$('#ac').text(_M('doConfig'));
$$('#wi').text(_M('doImport'));
$$('#we').text(_M('doExport'));

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

function _K(selector, fun) {
    return $$(selector).on('click', fun);
}

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
