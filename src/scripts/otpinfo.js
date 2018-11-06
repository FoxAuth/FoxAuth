//init OTP form stack object
const otpFormStack = [];
const otpBasicForm = document.querySelector('.newOTP').cloneNode(true);
const formBox = document.getElementById('otpFormBox');
const submitAll = document.getElementById('submitAll');
const genericMsgDiv = document.getElementById('genericMsg');
const genericMsgContent = genericMsgDiv.querySelector('.genericMsgContent');

//create new OTP form
document.querySelector('#otpNewBtn').addEventListener("click", () => {
    const otpFormBox = document.querySelector('#otpFormBox');
    const node = otpFormStack.length ? otpFormStack.pop() : otpBasicForm.cloneNode(true);
    // otpFormBox.appendChild(node);
    otpFormBox.insertBefore(node, otpFormBox.firstChild);
});

//delete OTP form
document.body.addEventListener("click", (e) => {
    const t = e.target;
    if (!t.classList || !t.classList.contains('deleteOTP')) {
        return;
    }
    const node = t.parentNode.parentNode.parentNode;
    if (node.parentNode) {
        otpFormStack.push(node.parentNode.removeChild(node));
    }
});

submitAll.addEventListener('click', () => {
    const { children } = formBox;
    const { length } = children;
    const result = [];
    for (let i = length - 1; i >= 0; i--) {
        result.push(getInfoFormValues(children[i]));
    }
    submitInfos(result);
});
formBox.addEventListener('submit', (event) => {
    event.preventDefault();
    const { target } = event;
    const form = target.parentNode.parentNode.parentNode;
    submitInfos([getInfoFormValues(form)]);
});
browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName !== 'local') return;
    if ((changes.isEncrypted && changes.isEncrypted.newValue !== false) || changes.passwordInfo) {
        checkPasswordInfo();
    }
});
window.addEventListener('storage', () => {
    checkPasswordInfo();
});
const submitInfos = lockAsyncFunc(async (updateInfos) => {
    let accountInfos = await getAccountInfos();
    accountInfos = mergeAccountInfos(accountInfos, updateInfos);
    await saveAccountInfos(accountInfos);
    htmlBrandNewChildren(formBox, otpBasicForm.cloneNode(true));
    popupGenericMsg('Accounts added');
});

init();
const accountInfoKeys = [
    'containerAssign',
    'localIssuer',
    'localAccountName',
    'localSecretToken',
    'localRecovery',
    'localOTPType',
    'localOTPAlgorithm',
    'localOTPPeriod',
    'localOTPDigits'
];
async function init() {
    await initBrowserContainers();
    //Get QrScan Result
    var qrresult = window.location.search.substring(1);
    updateInfoForm(document.querySelector('.newOTP'), {
        info: getDefaultAccountInfo(),
        containers: getBrowserContainers()
    });
    updateInfoForm(otpBasicForm, {
        info: getDefaultAccountInfo(),
        containers: getBrowserContainers()
    });
    if (qrresult.length > 0) {
        var scannedotp = new URLSearchParams(qrresult)
        document.querySelector('[name=containerAssign]').value = scannedotp.get('container')
        document.querySelector('[name=localAccountName]').value = scannedotp.get('account')
        document.querySelector('[name=localSecretToken]').value = scannedotp.get('key')
        document.querySelector('[name=localIssuer]').value = scannedotp.get('issuer')
    }
    checkPasswordInfo();
}
function getInfoFormValues(form) {
    return accountInfoKeys.reduce((result, key) => {
        const element = form.querySelector(`[name=${key}]`);
        if (element) {
            result[key] = element.value;
        }
        return result;
    }, {});
}
async function checkPasswordInfo() {
    const passwordInfo = await getPasswordInfo();
    if (passwordInfo.isEncrypted && (!passwordInfo.password || !passwordInfo.encryptIV)) {
        submitAll.setAttribute('disabled', '');
        setFormSecureInputStatus(formBox.children, 'disable');
    } else {
        submitAll.removeAttribute('disabled');
        setFormSecureInputStatus(formBox.children, 'enable');
    }
}
function setFormSecureInputStatus(formList, status) {
    const { length } = formList;
    for (let i = 0; i < length; i++) {
        const form = formList[i];
        if (status === 'disable') {
            form.querySelector('button').setAttribute('disabled', '');
        } else {
            form.querySelector('button').removeAttribute('disabled');
        }
    }
}
function popupGenericMsg(msg) {
    genericMsgContent.textContent = msg;
    genericMsgDiv.style.display = 'block';
    genericMsgDiv.style.opacity = 1;
    setTimeout(() => {
        genericMsgDiv.style.opacity = 0;
        setTimeout(() => {
            genericMsgDiv.style.display = 'none';
        }, 300);
    }, 3000);
}
