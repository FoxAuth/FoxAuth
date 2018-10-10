
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
