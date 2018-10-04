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

//create new OTP form
document.querySelector('.otpNewBtn').addEventListener("click", () => {
    const dom = document.querySelector('.newOTP');
    const c = el.cloneNode(true);
    dom.parentNode.appendChild(c);
});