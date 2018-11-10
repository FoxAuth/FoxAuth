export function showErrorMsg(msg) {
    browser.notifications.create({
        "type": "basic",
        "iconUrl": "../icons/icon.svg",
        "title": "FoxAuth Authenticator",
        "message": msg
    });
}
