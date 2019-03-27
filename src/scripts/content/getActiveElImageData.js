function getActiveElementImageData() {
    const { activeElement } = document;
    return getImageData(activeElement);
}
Promise.resolve(getActiveElementImageData());
