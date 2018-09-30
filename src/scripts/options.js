//reset notifi'
function resetnotifi() {
    browser.notifications.create({
        "type": "basic",
        "iconUrl": "../icons/icon.svg",
        "title": title,
        "message": content
      });
};

//genral option page reset
let firstreset = document.querySelector('.firstreset');
button.addEventListener('click', resetnotifi);
