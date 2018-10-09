[...document.querySelectorAll(".checkbox-icon")].forEach(
	e => (e.onclick = () => e.classList.toggle("checked"))
);
