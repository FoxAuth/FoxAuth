import './jsQR.js';
import '/scripts/common/getImageData.js';

function scanImageData(imageData) {
    const data = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      })
    if (data) {
        return data.data;
    } else {
        return null;
    }
}

function scanImage(image) {
    const imageData = getImageData(image);
    if (!imageData) {
        return Promise.resolve(null);
    }
    return Promise.resolve(scanImageData(imageData));
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
    scanVideo,
    scanImageData
}
