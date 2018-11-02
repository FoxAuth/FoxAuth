;
(function () {
    const fromFoxAuth = document.getElementById('foxauth');
    const fromAuthenticator = document.getElementById('authenticator');
    const fileInput = document.getElementById('file');
    const overwriteKeys = ['accountInfos', 'isEncrypted', 'passwordInfo', 'settings'];
    const warningMsgDiv = document.querySelector('.warningMsg');
    const warningMsgContent = warningMsgDiv.querySelector('.warningMsgContent');
    const warningConfirmBtn = warningMsgDiv.querySelector('.warningMsgBtn');
    const warningCloseBtn = warningMsgDiv.querySelector('.warningMsgCloseBtn');
    const errorMsgDiv = document.querySelector('.errorMsg');
    const errorMsgContent = errorMsgDiv.querySelector('.errorMsgContent');
    const errorConfirmBtn = errorMsgDiv.querySelector('.errorMsgBtn');
    const errorCloseBtn = errorMsgDiv.querySelector('.errorMsgCloseBtn');
    const shadowCover = document.querySelector('.warning-cover');
    const openMessage = (function () {
        let zIndex = 11;
        return function ({
            message = '',
            confirmBtn,
            confirmBtnText = '',
            container,
            confrimCallback = () => { },
            cancelBtn,
            cancelCallback = () => { },
            contentElement,
        }) {
            // message
            contentElement.textContent = message || 'Oops!';
            // cancel
            const cancelFunc = (type) => {
                container.style.opacity = 0;
                if (type !== 'close') {
                    cancelCallback();
                }
                cancelBtn.removeEventListener('click', cancelFunc);
                setTimeout(() => {
                    container.style.display = 'none';
                    shadowCover.style.display = 'none';
                }, 300);
            };
            cancelBtn.addEventListener('click', cancelFunc);
            // confirm
            if (confirmBtnText === '') {
                confirmBtn.style.display = 'none';
                setTimeout(() => cancelFunc('close'), 3650);
            } else {
                confirmBtn.style.display = 'block';
                const confirmFunc = () => {
                    confrimCallback();
                    confirmBtn.removeEventListener('click', confirmFunc);
                    cancelFunc('close');
                };
                confirmBtn.addEventListener('click', confirmFunc);
                shadowCover.style.display = 'block';
            }
            container.style.zIndex = zIndex++;
            container.style.display = 'flex';
            container.style.opacity = 1;
        };
    })();

    // foxauth authy google microsoft lastpass authenticator
    let importFrom = '';

    fromFoxAuth.addEventListener('click', (event) => {
        importFrom = 'foxauth';
        fileInput.click();
    });
    fromAuthenticator.addEventListener('click', (event) => {
        importFrom = 'authenticator';
        fileInput.click();
    });
    fileInput.addEventListener('change', async (event) => {
        const { files } = event.target;
        if (files.length === 0) return;
        const file = files[0];
        const data = await doProcess(file, importFrom);
        doImport(data);
    });

    async function doProcess(file, importFrom) {
        let data = {};
        switch (importFrom) {
            case 'foxauth':
                data = await readJSON(file);
                data = transformOwnJson(data);
                return data;
            case 'authenticator':
                data = await readJSON(file);
                console.log(data);
                data = transformAuthenticator(data);
                return data;
        }
    }
    async function doImport(importData) {
        try {
            const otherLocalData = await browser.storage.local.get({
                accountInfos: [],
                isEncrypted: false,
                passwordInfo: {},
                settings: {}
            });
            if (Boolean(otherLocalData.isEncrypted) !== Boolean(importData.isEncrypted)) {
                // different encryption setting
                throw new Error('Import error due to different encryption setting');
            }
            const mergedResult = {
                ...otherLocalData,
                ...importData
            };
            const localVersoinData = await browser.storage.local.get({
                accountInfoVersion: 1
            });
            await browser.storage.local.set({
                accountInfoVersion: localVersoinData.accountInfoVersion + 1,
                ...mergedResult,
            });
        } catch (error) {
            console.log(error);
            showErrorMessage({
                message: error.message
            });
        }
    }
    function readJSON(file) {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => {
                try {
                    resolve(JSON.parse(fr.result));
                } catch (error) {
                    reject(new Error('Invalid file'));
                }
            };
            fr.onerror = () => {
                reject(new Error('Invalid file'));
            };
            fr.readAsText(file);
        });
    }
    function transformOwnJson(data) {
        if (!data || typeof data !== 'object') return {};
        const keys = Object.keys(data);
        return keys.reduce((result, key) => {
            if (overwriteKeys.indexOf(key) >= 0) {
                result[key] = data[key];
            }
            return result;
        }, {});
    }
    function transformAuthenticator(data) {
        const accountInfos = Object.keys(data).reduce((result, key) => {
            const value = data[key];
            if (value && value.encrypted === false) {
                let otpType = 'Time based';
                switch(value.type) {
                    case 'totp':
                        otpType = 'Time based';
                        break;
                    case 'hotp':
                        otpType = 'Counter based';
                }
                result.push({
                    containerAssign: '',
                    localIssuer: value.issuer,
                    localAccountName: value.account,
                    localSecretToken: value.secret,
                    localRecovery: '',
                    localOTPType: otpType,
                    localOTPAlgorithm: 'SHA-1',
                    localOTPPeriod: '30',
                    localOTPDigits: value.type === 'battle' ? '8' : '6'
                });
            }
            return result;
        }, []);
        return {
            accountInfos,
            isEncrypted: false,
        };
    }

    function showWarningMessage({
        message = 'Warning oops!',
        confirmBtnText = ''
    }) {
        return new Promise((resolve, reject) => {
            openMessage({
                message,
                confirmBtn: warningConfirmBtn,
                confirmBtnText,
                container: warningMsgDiv,
                confrimCallback: () => resolve(1),
                cancelBtn: warningCloseBtn,
                cancelCallback: () => resolve(0),
                contentElement: warningMsgContent,
            });
        });
    }
    function showErrorMessage({
        message = 'Error oops!',
        confirmBtnText = ''
    }) {
        return new Promise((resolve, reject) => {
            openMessage({
                message,
                confirmBtn: errorConfirmBtn,
                confirmBtnText,
                container: errorMsgDiv,
                confrimCallback: () => resolve(1),
                cancelBtn: errorCloseBtn,
                cancelCallback: () => resolve(0),
                contentElement: errorMsgContent,
            });
        });
    }
})();
