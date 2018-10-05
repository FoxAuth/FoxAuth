//reset notifi'
function resetNotifi() {
    browser.notifications.create({
        "type": "basic",
        "iconUrl": "../icons/icon.svg",
        "title": "FoxAuth Authenticator",
        "message": "Reset done."
    });
};

//genral option page reset
document.querySelector('.resetbtn').addEventListener("click", resetNotifi);

//toggle additional form items
document.getElementById('moreFormbtn').addEventListener("click", () => {
    var x = document.getElementById("moreFormItem");
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
});

//create new OTP form
document.querySelector('.otpNewBtn').addEventListener("click", () => {
    const dom = document.querySelector('.newOTP');
    const c = dom.cloneNode(true);
    dom.parentNode.appendChild(c);
});

//delete OTP form
document.querySelector('.deleteOTP').addEventListener("click", () => {
    var node = document.getElementsByClassName('.newOTP');
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
});