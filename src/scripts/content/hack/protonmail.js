(async function listener() {
    let input = document.getElementById('twoFactorCode')
    let loginBtn = document.getElementById('login_btn_2fa')
    let timer = null

    if (loginBtn && input) {
        setLoginBtnStatus()
    } else {
        timer = setTimeout(() => {
            listener()
        }, 1000)
    }

    function setLoginBtnStatus() {
        if (input.value.length >= 6) {
            loginBtn.removeAttribute('disabled')
            clearTimeout(timer)
        } else {
            loginBtn.setAttribute('disabled', 'true')
            timer = setTimeout(() => {
                listener()
            }, 1000)
        }
    }
})()
