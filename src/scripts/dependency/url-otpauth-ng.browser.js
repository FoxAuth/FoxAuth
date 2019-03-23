(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.urlOtpauth = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

    /*!
    * https://github.com/huihuimoe/url-otpauth-ng
    * Released under the MIT license
    */
    
    /** @module url-otpauth */
    
    var _URL = typeof URL !== 'undefined' ? URL : require('url').URL
    
    //
    // Exception types
    //
    
    var ErrorType = {
        INVALID_ISSUER: 0,
        INVALID_LABEL: 1,
        INVALID_PROTOCOL: 2,
        MISSING_ACCOUNT_NAME: 3,
        MISSING_COUNTER: 4,
        MISSING_ISSUER: 5,
        MISSING_SECRET_KEY: 6,
        UNKNOWN_OTP: 7,
        INVALID_DIGITS: 8,
        UNKNOWN_ALGORITHM: 9
    };
    
    var PossibleDigits = [6, 8];
    
    var PossibleAlgorithms = ["SHA1", "SHA256", "SHA512", "MD5"];
    
    function OtpauthInvalidURL(errorType) {
        this.name = 'OtpauthInvalidURL';
        this.message = 'Given otpauth:// URL is invalid. (Error ' + errorType + ')';
        this.errorType = errorType;
    }
    
    OtpauthInvalidURL.prototype = new Error();
    OtpauthInvalidURL.prototype.constructor = OtpauthInvalidURL;
    
    //
    // Code
    //
    
    module.exports = {
        /**
         * Parses an OTPAuth URI.
         *
         * Parses an URL as described in Google Authenticator's "KeyUriFormat" document (see:
         * [https://code.google.com/p/google-authenticator/wiki/KeyUriFormat](https://code.google.com/p/google-authenticator/wiki/KeyUriFormat))
         * and returns an object that contains the following properties:
         *
         * - `account`: The account name.
         * - `digits`: The number of digits of the resulting OTP. Default is 6 (six).
         * - `key`: The shared key in Base32 encoding.
         * - `issuer`: Provider or service this account is associated with. The default is the empty
         *   string.
         * - `type`: Either the string `hotp` or `totp`.
         *
         * OTP of type `hotp` have an additional `counter` field which contains the start value for the
         * HOTP counter. In all other cases this field is missing from the resulting object.
         *
         * @typedef {Object} Result
         * @prop {string} type
         * @prop {string} account
         * @prop {string} key
         * @prop {string} [issuer]
         * @prop {string} digits
         * @prop {string} [algorithm]
         * @prop {string} [period]
         * @prop {string} [counter]
         * @param rawUrl {string} The URI to parse.
         * @returns {Result} An object with properties described above.
         */
        parse: function parse(rawUrl) {
            var ret = {};
    
            //
            // Protocol
            //
    
            try {
                var parsed = new _URL(rawUrl);
            } catch (error) {
                throw error instanceof TypeError ? new OtpauthInvalidURL(ErrorType.INVALID_PROTOCOL) : error;
            }
    
            if (parsed.protocol !== 'otpauth:') {
                throw new OtpauthInvalidURL(ErrorType.INVALID_PROTOCOL);
            }
    
            parsed.protocol = 'http';
            parsed = new _URL(parsed);
    
            //
            // Type
            //
    
            var otpAlgo = decodeURIComponent(parsed.host);
    
            if (otpAlgo !== 'hotp' && otpAlgo !== 'totp') {
                throw new OtpauthInvalidURL(ErrorType.UNKNOWN_OTP);
            }
    
            ret.type = otpAlgo;
    
            //
            // Label (contains account name, may contain issuer)
            //
    
            var label = parsed.pathname.substring(1);
            var labelComponents = label.split(~label.indexOf(':') ? ':' : '%3A');
            var issuer = '';
            var account = '';
    
            if (labelComponents.length === 1) {
                account = decodeURIComponent(labelComponents[0]);
            } else if (labelComponents.length === 2) {
                issuer = decodeURIComponent(labelComponents[0]);
                account = decodeURIComponent(labelComponents[1]);
            } else {
                throw new OtpauthInvalidURL(ErrorType.INVALID_LABEL);
            }
    
            if (account.length < 1) {
                throw new OtpauthInvalidURL(ErrorType.MISSING_ACCOUNT_NAME);
            }
    
            if ((labelComponents.length === 2) && (issuer.length < 1)) {
                throw new OtpauthInvalidURL(ErrorType.INVALID_ISSUER);
            }
    
            ret.account = account;
    
            //
            // Parameters
            //
    
            var parameters = parsed.searchParams;
    
            // Secret key
            if (!parameters.has('secret')) {
                throw new OtpauthInvalidURL(ErrorType.MISSING_SECRET_KEY);
            }
    
            ret.key = parameters.get('secret');
    
            // Issuer
            if (parameters.has('issuer')) {
                // issuer field exits in search params would overwrite the same in pathname
                issuer = parameters.get('issuer')
            }

            ret.issuer = issuer;
    
            // OTP digits
            ret.digits = 6;  // Default is 6
    
            if (parameters.has('digits')) {
                var parsedDigits = parseInt(parameters.get('digits'), 10);
                if (PossibleDigits.indexOf(parsedDigits) == -1) {
                    throw new OtpauthInvalidURL(ErrorType.INVALID_DIGITS);
                } else {
                    ret.digits = parsedDigits;
                }
            }
    
            // Algorithm to create hash
            if (parameters.has('algorithm')) {
                if (PossibleAlgorithms.indexOf(parameters.get('algorithm')) == -1) {
                    throw new OtpauthInvalidURL(ErrorType.UNKNOWN_ALGORITHM);
                } else {
                    // Optional 'algorithm' parameter.
                    ret.algorithm = parameters.get('algorithm');
                }
            }
    
            // Period (only for TOTP)
            if (otpAlgo === 'totp') {
                // Optional 'period' parameter for TOTP.
                if (parameters.has('period')) {
                    ret.period = parseFloat(parameters.get('period'));
                }
            }
    
            // Counter (only for HOTP)
            if (otpAlgo === 'hotp') {
                if (!parameters.has('counter')) {
                    // We require the 'counter' parameter for HOTP.
                    throw new OtpauthInvalidURL(ErrorType.MISSING_COUNTER);
                } else {
                    ret.counter = parseInt(parameters.get('counter'), 10);
                }
            }
    
            return ret;
        },
    
        /**
         * Enumeration of all error types raised by `OtpauthInvalidURL`.
         */
        ErrorType: ErrorType,
    
        /**
         * Exception thrown whenever there's an error deconstructing an 'otpauth://' URI.
         *
         * You can query the `errorType` attribute to obtain the exact reason for failure. The
         * `errorType` attributes contains a value from the `ErrorType` enumeration.
         */
        OtpauthInvalidURL: OtpauthInvalidURL
    };
    
    },{"url":2}],2:[function(require,module,exports){
    
    },{}]},{},[1])(1)
    });
