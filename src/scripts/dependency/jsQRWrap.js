import jsQR from './jsQR.js';

function scanImage(image) {
    if (!(image instanceof Image)) throw new Error('Invalid type of argument 1, required Image');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = image.width;
    const height = image.height;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return new Promise((resolve, reject) => {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = jsQR(imageData.data, width, height, {
            inversionAttempts: "dontInvert",
          })
        if (data) {
            resolve(data.data)
        } else {
            resolve(null)
        }
    })
}

function scanVideo(video) {
    if (!(video instanceof HTMLVideoElement)) throw new Error('Invalid type of argument 1, required HTMLVideoElement');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = 360;
    canvas.height = 360;
    ctx.drawImage(video, Math.max((width - canvas.width) / 2, 0), Math.max((height - canvas.height) / 2, 0), canvas.width, canvas.height);
    return new Promise((resolve) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = jsQR(imageData.data, canvas.width, canvas.height, {
            inversionAttempts: "dontInvert",
          })
        if (data) {
            resolve(data.data)
        } else {
            resolve(null)
        }
    })
}

export {
    scanImage,
    scanVideo
}
