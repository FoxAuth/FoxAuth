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