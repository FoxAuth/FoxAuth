const rememPass = document.getElementById("rememPass");
const rememPassSession = document.getElementById("rememPassSession");

rememPass.addEventListener("input", function() {
	rememPassSession.disabled = !this.checked;
	if (rememPassSession.disabled) rememPassSession.checked = false;
});
