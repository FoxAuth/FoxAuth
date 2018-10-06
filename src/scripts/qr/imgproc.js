var imgproc = {
    otsu_level: function (histogram, total) {
        var sum = 0;
        for (var i = 1; i < 256; ++i) sum += i * histogram[i];
        var sumB = 0;
        var wB = 0;
        var wF = 0;
        var mB;
        var mF;
        var max = 0.0;
        var between = 0.0;
        var threshold1 = 0.0;
        var threshold2 = 0.0;
        for (var i = 0; i < 256; ++i) {
            wB += histogram[i];
            if (wB == 0) continue;
            wF = total - wB;
            if (wF == 0) break;
            sumB += i * histogram[i];
            mB = sumB / wB;
            mF = (sum - sumB) / wF;
            between = wB * wF * (mB - mF) * (mB - mF);
            if (between >= max) {
                threshold1 = i;
                if (between > max) {
                    threshold2 = i;
                }
                max = between;
            }
        }
        return (threshold1 + threshold2) / 2.0;
    },
    otsu: function (ctx, x, y, w, h) {

        var imageData = ctx.getImageData(x, y, w, h);
        var data = imageData.data;
        var area = data.length / 4;
        var hist = new Array(256).fill(0);

        for (var i = 0; i < data.length; i += 4) {
            var brightness = ~~(0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2]);
            data[i] = brightness;
            hist[brightness]++;
        }

        var thresh = imgproc.otsu_level(hist, area)
        for (var i = 0; i < data.length; i += 4) {
            data[i] = data[i] > thresh ? 255 : 0;
            data[i + 1] = data[i];
            data[i + 2] = data[i];
        }


        ctx.putImageData(imageData, x, y);
    },
    invert: function (ctx, x, y, w, h) {

        var imageData = ctx.getImageData(x, y, w, h);
        var data = imageData.data;

        for (var i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }

        ctx.putImageData(imageData, x, y);
    }
}