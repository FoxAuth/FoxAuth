
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

//container tabs
var div = document.getElementById('containerAssign');

if (browser.contextualIdentities === undefined) {
    div.setAttribute("disable");
} else {
  browser.contextualIdentities.query({})
    .then((identities) => {
      if (!identities.length) {
        div.setAttribute("disable");
        return;
      }
      identities.map(x => {
        const opt = document.createElement('option')
        opt.innerHTML = x.name
        return opt
      }).forEach(x => document.querySelector('select').appendChild(x))
  });
}