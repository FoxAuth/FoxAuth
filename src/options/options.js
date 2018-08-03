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
        return fn(inner(o))
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

autodark();

function ieM(selector) {
    return;
}

function importExport(_import) {
    return fasle;
}

function eM(selector) {
    return;
}

function encrypted(_import) {
    return false;
}

function blackOptions() {
    return false;
}

function bM(selector) {
    return;
}

function backup(_import) {
    return false;
}
