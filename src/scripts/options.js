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
document.body.addEventListener("click", (e) => {
    const t = e.target;
    if (!t.classList || !t.classList.contains('moreFormbtn')) {
        return;
    }
    const x = t.parentNode.querySelector('.moreFormItem');
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
});

//create new OTP form
document.querySelector('.otpNewBtn').addEventListener("click", () => {
    const dom = document.querySelector('.newOTP');
    const node = dom.cloneNode(true);
    dom.parentNode.appendChild(node);
});

//delete OTP form
document.body.addEventListener("click", (e) => {
    const t = e.target;
    if (!t.classList || !t.classList.contains('deleteOTP')) {
        return;
    }
    const node = t.parentNode;
    if (node.parentNode) {
      node.parentNode.removeChild(node);
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

document.getElementById("eye").addEventListener("click", function () {
    if (pwShown == 0) {
        pwShown = 1;
        show();
    } else {
        pwShown = 0;
        hide();
    }
}, false);

//container tabs
var div = document.getElementById('containerAssign');
  
if (browser.contextualIdentities === undefined) {
    div.setAttribute("disable");
} else {
  browser.contextualIdentities.query({})
    .then((identities) => {
      if (!identities.length) {
        browser.notifications.create({
            "type": "basic",
            "iconUrl": "../icons/icon.svg",
            "title": "FoxAuth Authenticator",
            "message": "Waring: no container found."
        });
        return;
      }

     for (let identity of identities) {
       let row = document.createElement('div');
       let span = document.createElement('span');
       span.className = 'identity';
       span.innerText = identity.name;
       span.style = `color: ${identity.color}`;
       console.log(identity);
       row.appendChild(span);
       createOptions(row, identity);
       div.appendChild(row);
     }
  });
}