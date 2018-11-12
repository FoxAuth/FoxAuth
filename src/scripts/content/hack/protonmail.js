(async function listener() {
    let input = document.getElementById('twoFactorCode')
    let loginBtn = document.getElementById('login_btn_2fa')

    if (loginBtn && input) {
        setLoginBtnStatus()
    } else {
        setTimeout(() => {
            listener()
        }, 1000)
    }

    function setLoginBtnStatus() {
        if (input.value.length >= 6) {
            loginBtn.removeAttribute('disabled')
        } else {
            loginBtn.setAttribute('disabled', 'true')
            setTimeout(() => {
                listener()
            }, 1000)
        }
    }
})()
