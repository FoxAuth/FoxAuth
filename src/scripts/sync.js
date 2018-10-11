//toggle checkbox
[...document.getElementsByClassName('ulPass')].forEach(ul => {
  const applyNest = p => {
    if (!p) return;
    const parent = p.querySelector('input[type=checkbox]');
    const cp = p.querySelector('ul');
    console.log(parent, cp);
    if (cp) {
      const children = cp.children;
      parent.addEventListener('input', () => {
        [...children].forEach(e => {
          const i = e.querySelector('input[type=checkbox]');
          if (i) i.disabled = !parent.checked;
        });
      });
      [...children].forEach(applyNest);
    }
  };
  [...ul.children].forEach(applyNest);
});

//msgDismiss
document.getElementsByClassName("syncbtn").addEventListener("click", () => {
  document.getElementsByClassName("genericMsg").removeAttribute("display: none")
});

//import handling
var fileSelect = document.getElementById("operatebtn"),
  fileElem = document.getElementById("fileElem");

fileSelect.addEventListener("click", function (e) {
  if (fileElem) {
    fileElem.click();
  }
  e.preventDefault();
}, false);