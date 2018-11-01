async function doScanQR() {
    function getImage(url) {
        return new Promise((resolve, reject) => {
            const image = new Image()
            image.onload = () => resolve(image)
            image.onerror = () => reject('Can\'t load scan result')
            image.src = url
        });
    }
    const activeTabs = await browser.tabs.query({
        active: true
    })
    if (activeTabs.length !== 1) return
    const activeTab = activeTabs[0]
    const dataURL = await browser.tabs.captureTab(activeTab.id)
    const image = await getImage(dataURL)
    const result = await QrScanner.scanImage(image)
    // validate and parse URL
    const otpInfo = urlOtpauth.parse(result)
    otpInfo.container = activeTab.cookieStoreId === 'firefox-default' ? '' : activeTab.cookieStoreId
    const params = new URLSearchParams(otpInfo)
    browser.tabs.create({
        url: `/options/otpinfo.html?${params.toString()}`
    })
}
