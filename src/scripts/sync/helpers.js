const parseQueryString = function (str) {
    var ret = Object.create(null);
    if (typeof str !== 'string') {
        return ret;
    }
    str = str.trim().replace(/^(\?|#|&)/, '');
    if (!str) {
        return ret;
    }
    str.split('&').forEach(function (param) {
        var parts = param.replace(/\+/g, ' ').split('=');
        // Firefox (pre 40) decodes `%3D` to `=`
        // https://github.com/sindresorhus/query-string/pull/37
        var key = parts.shift();
        var val = parts.length > 0 ? parts.join('=') : undefined;
        key = decodeURIComponent(key);
        // missing `=` should be `null`:
        // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
        val = val === undefined ? null : decodeURIComponent(val);
        if (ret[key] === undefined) {
            ret[key] = val;
        } else if (Array.isArray(ret[key])) {
            ret[key].push(val);
        } else {
            ret[key] = [ret[key], val];
        }
    });
    return ret;
};

// read blob as json
function readAsJSON(blob) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => {
            try {
                resolve(JSON.parse(fr.result))
            } catch (error) {
                const err = new Error('Invalid file contents');
                err.type = 'INVALID_FILE_CONTENTS';
                reject(err);
            }
        };
        fr.onerror = () => {
            const err = new Error('Invalid file');
            err.type = 'READ_FILE_ERROR';
            reject(err);
        }
        fr.readAsText(blob);
    });
}

function transformRemoteData(remoteData) {
    return {
        accountInfos: Array.isArray(remoteData.accountInfos) ? remoteData.accountInfos : [],
        isEncrypted: Boolean(remoteData.isEncrypted),
        passwordInfo: {
            encryptIV: (remoteData.passwordInfo && remoteData.passwordInfo.encryptIV) || null
        },
        settings: {
            passwordStorage: (remoteData.settings && remoteData.settings.passwordStorage) || "storage.local"
        },
    };
}

export {
    parseQueryString,
    readAsJSON,
    transformRemoteData
}
