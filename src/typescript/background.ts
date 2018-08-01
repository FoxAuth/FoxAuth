// Initializes MDUI library
const mdui = require('../libs/mdui.min.js');
const $$ = mdui.JQ;

/**
 * Return extension name
 */
function getExtName() {
  return browser.i18n.getMessage('extName');
}

const _m: Function = browser.i18n.getMessage;

/**
 * Simple hello function
 */
const pluginhello: Function = () => console.log(+': Plugin Hello');

/**
 * Log debug info
 *
 * @param msg Message to print
 */
const logDebug: Function = (msg: string) => console.log('Debug: ' + msg);

/**
 * Log info
 *
 * @param msg Message to print
 */
const logInfo: Function = (msg: string) => console.log('Info: ' + msg);

// Features
/**
 * Written in TypeScript(gts, typescript)
 * Import / export acconts list
 * Password blowfish encryption(blowfish)
 * Dropbox WebDav backup(webdav, dropbox)
 * QR Code(jsqr)
 * Matrial Design(mdui)
 * OTP Support(otplib)
 * Firefox support
 * Code form autofill
 * Hand enter token and key
 */
