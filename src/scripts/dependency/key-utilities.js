/**
 * file combining
 * transpiled by typescript compiler (see http://www.typescriptlang.org/play/index.html)
 * (1) https://github.com/Authenticator-Extension/Authenticator/blob/dev/src/models/otp.ts
 * (2) https://github.com/Authenticator-Extension/Authenticator/blob/dev/src/models/key-utilities.ts
 */
// (1)
var OTPType;
(function (OTPType) {
    OTPType[OTPType["totp"] = 1] = "totp";
    OTPType[OTPType["hotp"] = 2] = "hotp";
    OTPType[OTPType["battle"] = 3] = "battle";
    OTPType[OTPType["steam"] = 4] = "steam";
    OTPType[OTPType["hex"] = 5] = "hex";
    OTPType[OTPType["hhex"] = 6] = "hhex";
})(OTPType || (OTPType = {}));
// (2)
var KeyUtilities = /** @class */ (function () {
    function KeyUtilities() {
    }
    KeyUtilities.dec2hex = function (s) {
        return (s < 15.5 ? '0' : '') + Math.round(s).toString(16);
    };
    KeyUtilities.hex2dec = function (s) {
        return Number("0x" + s);
    };
    KeyUtilities.hex2str = function (hex) {
        var str = '';
        for (var i = 0; i < hex.length; i += 2) {
            str += String.fromCharCode(this.hex2dec(hex.substr(i, 2)));
        }
        return str;
    };
    KeyUtilities.leftpad = function (str, len, pad) {
        if (len + 1 >= str.length) {
            str = new Array(len + 1 - str.length).join(pad) + str;
        }
        return str;
    };
    KeyUtilities.base32tohex = function (base32) {
        var base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        var bits = '';
        var hex = '';
        var padding = 0;
        for (var i = 0; i < base32.length; i++) {
            if (base32.charAt(i) === '=') {
                bits += '00000';
                padding++;
            }
            else {
                var val = base32chars.indexOf(base32.charAt(i).toUpperCase());
                bits += this.leftpad(val.toString(2), 5, '0');
            }
        }
        for (var i = 0; i + 4 <= bits.length; i += 4) {
            var chunk = bits.substr(i, 4);
            hex = hex + Number("0b" + chunk).toString(16);
        }
        // if (hex.length % 2 && hex[hex.length - 1] === '0') {
        //   hex = hex.substr(0, hex.length - 1);
        // }
        switch (padding) {
            case 0:
                break;
            case 6:
                hex = hex.substr(0, hex.length - 8);
                break;
            case 4:
                hex = hex.substr(0, hex.length - 6);
                break;
            case 3:
                hex = hex.substr(0, hex.length - 4);
                break;
            case 1:
                hex = hex.substr(0, hex.length - 2);
                break;
            default:
                throw new Error('Invalid Base32 string');
        }
        return hex;
    };
    KeyUtilities.base26 = function (num) {
        var chars = '23456789BCDFGHJKMNPQRTVWXY';
        var output = '';
        var len = 5;
        for (var i = 0; i < len; i++) {
            output += chars[num % chars.length];
            num = Math.floor(num / chars.length);
        }
        if (output.length < len) {
            output = new Array(len - output.length + 1).join(chars[0]) + output;
        }
        return output;
    };
    KeyUtilities.generate = function (type, secret, counter, period) {
        secret = secret.replace(/\s/g, '');
        var len = 6;
        var b26 = false;
        var key;
        switch (type) {
            case OTPType.totp:
            case OTPType.hotp:
                key = this.base32tohex(secret);
                break;
            case OTPType.hex:
            case OTPType.hhex:
                key = secret;
                break;
            case OTPType.battle:
                key = this.base32tohex(secret);
                len = 8;
                break;
            case OTPType.steam:
                key = this.base32tohex(secret);
                len = 10;
                b26 = true;
                break;
            default:
                key = this.base32tohex(secret);
        }
        if (!key) {
            throw new Error('Invalid secret key');
        }
        if (type !== OTPType.hotp && type !== OTPType.hhex) {
            var epoch = Math.round(new Date().getTime() / 1000.0);
            if (localStorage.offset) {
                epoch = epoch + Number(localStorage.offset);
            }
            counter = Math.floor(epoch / period);
        }
        var time = this.leftpad(this.dec2hex(counter), 16, '0');
        if (key.length % 2 === 1) {
            if (key.substr(-1) === '0') {
                key = key.substr(0, key.length - 1);
            }
            else {
                key += '0';
            }
        }
        // external library for SHA functionality
        var hmacObj = new jsSHA('SHA-1', 'HEX');
        hmacObj.setHMACKey(key, 'HEX');
        hmacObj.update(time);
        var hmac = hmacObj.getHMAC('HEX');
        var offset = 0;
        if (hmac !== 'KEY MUST BE IN BYTE INCREMENTS') {
            offset = this.hex2dec(hmac.substring(hmac.length - 1));
        }
        var otp = (this.hex2dec(hmac.substr(offset * 2, 8)) & this.hex2dec('7fffffff')) +
            '';
        if (b26) {
            return this.base26(Number(otp));
        }
        if (otp.length < len) {
            otp = new Array(len - otp.length + 1).join('0') + otp;
        }
        return (otp).substr(otp.length - len, len).toString();
    };
    return KeyUtilities;
}());
