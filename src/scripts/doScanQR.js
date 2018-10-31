async function doScanQR() {
    const activeTabs = await browser.tabs.query({
        active: true
    })
    if (activeTabs.length !== 1) return
    const activeTab = activeTabs[0]
    const dataURL = await browser.tabs.captureTab(activeTab.id)
    const result = await QrScanner.scanImage(dataURL)
    // validate and parse URL
    const otpInfo = urlOtpauth.parse(result)
    otpInfo.container = activeTab.cookieStoreId === 'firefox-default' ? '' : activeTab.cookieStoreId
    const params = new URLSearchParams(otpInfo)
    browser.tabs.create({
        url: `/options/otpinfo.html?${params.toString()}`
    })
}
