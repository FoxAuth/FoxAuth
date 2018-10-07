
// source: http://stackoverflow.com/a/11058858
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

class MessageEncryption {
  constructor(secretKey) {
    this.instance = new Keychain(btoa(secretKey))
  }

  // https://stackoverflow.com/a/40764378
  /**
   * @param {string} password 
   * @returns {Promise<string>} encryptedPassword
   */
  encrypt(password) {
    return this.instance.encryptFile(encoder.encode(password).buffer).then(arr => ab2str(arr))
  }

  /**
   * @param {string} encryptedPassword
   * @returns {Promise<string>} password
   */
  decrypt(encryptedPassword) {
    return this.instance.decryptFile(str2ab(encryptedPassword)).then(arr => decoder.decode(arr))
  }
}
