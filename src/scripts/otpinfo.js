//init OTP form stack object
const otpFormStack = [];
const otpBasicForm = document.querySelector('.newOTP').cloneNode(true);

//create new OTP form
document.querySelector('.otpNewBtn').addEventListener("click", () => {
    const otpFormBox = document.querySelector('#otpFormBox');
    const node = otpFormStack.length? otpFormStack.pop() : otpBasicForm.cloneNode(true);
    otpFormBox.appendChild(node);
});

//delete OTP form
document.body.addEventListener("click", (e) => {
    const t = e.target;
    if (!t.classList || !t.classList.contains('deleteOTP')) {
        return;
    }
    const node = t.parentNode;
    if (node.parentNode) {
      otpFormStack.push(node.parentNode.removeChild(node));
    }
});


//toggle token
function show() {
    var p = document.getElementById('newSecretToken');
    p.setAttribute('type', 'text');
}

function hide() {
    var p = document.getElementById('newSecretToken');
    p.setAttribute('type', 'password');
}

var pwShown = 0;

document.querySelector(".eye").addEventListener("click", function () {
    if (pwShown == 0) {
        pwShown = 1;
        show();
    } else {
        pwShown = 0;
        hide();
    }
}, false);

//Get QrScan Result
var qrresult = decodeURIComponent(window.location.search.substring(1))
if (qrresult.length > 0) {
    var scannedotp = new URL(qrresult)
    console.log(scannedotp)
    document.getElementById('newAccountName').value = scannedotp.pathname.substring(7)
    document.getElementById('newSecretToken').value = scannedotp.searchParams.get('secret')
    document.getElementById('newIssuer').value = scannedotp.searchParams.get('issuer')
}
