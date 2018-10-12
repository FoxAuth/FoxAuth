
//toggle additional form items
document.body.addEventListener("click", (e) => {
    const t = e.target;
    if (!t.classList || !t.classList.contains('moreFormbtn')) {
        return;
    }
    const x = t.parentNode.parentNode.querySelector('.moreFormItem');
    if (window.getComputedStyle(x).display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
});

// toggle password
document.body.addEventListener('click', function (e) {
    const t = e.target;
    if (!t.classList || !t.classList.contains('eye')) {
        return;
    }
    const input = e.target.parentNode.previousElementSibling;
    input.type = (input.type === 'password' ? 'text' : 'password')
});
