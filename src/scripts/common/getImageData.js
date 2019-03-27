/**
 * get image data from <img> or <canvas>
 * @param {Image|HTMLCanvasElement} element
 */
function getImageData(element) {
    const nodeName = element.nodeName.toUpperCase();
    if (nodeName === 'IMG') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = element.width;
        const height = element.height;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(element, 0, 0, width, height);
        return getCanvasImageData(canvas);
    } else if (nodeName === 'CANVAS') {
        return getCanvasImageData(element);
    }
    return null;
}
function getCanvasImageData(canvas) {
    const ctx = canvas.getContext('2d');
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

window.getImageData = getImageData;
undefined
