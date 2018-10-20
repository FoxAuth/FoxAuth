//init OTP form stack object
const otpFormStack = [];
const otpBasicForm = document.querySelector('.newOTP').cloneNode(true);
const formBox = document.getElementById('otpFormBox');

//create new OTP form
document.querySelector('#otpNewBtn').addEventListener("click", () => {
    const otpFormBox = document.querySelector('#otpFormBox');
    const node = otpFormStack.length? otpFormStack.pop() : otpBasicForm.cloneNode(true);
    // otpFormBox.appendChild(node);
    otpFormBox.insertBefore(node,otpFormBox.firstChild);
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

document.getElementById('submitAll').addEventListener('click', () => {
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
const lockAsyncFunc = (asyncFunc) => {
    // pending, finish
    let status = 'finish';
    const wrapped = async function(...args) {
        status = 'pending';
        await asyncFunc(...args);
        status = 'finish';
    };
    return function(...args) {
        if (status === 'pending') {
            return;
        }
        wrapped(...args);
    };
};
const submitInfos = lockAsyncFunc(async (updateInfos) => {
    const accountInfos = await getAccountInfos();
    updateInfos.forEach((info) => {
        const index = findIndexOfSameAccountInfo(accountInfos, info);
        if (index >= 0) {
            accountInfos.splice(index, 1, {
                ...accountInfos[index],
                ...info
            });
        } else {
            accountInfos.push({
                ...getDefaultAccountInfo(),
                ...info
            });
        }
    });
    await saveAccountInfos(accountInfos);
    htmlBrandNewChildren(formBox, otpBasicForm.cloneNode(true));
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
        document.querySelector('[name=localAccountName]').value = scannedotp.get('account')
        document.querySelector('[name=localSecretToken]').value = scannedotp.get('key')
        document.querySelector('[name=localIssuer]').value = scannedotp.get('issuer')
    }
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
