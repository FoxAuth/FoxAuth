import '../dependency/jsondiffpatch.umd.slim.js';

const diffPatcher = jsondiffpatch.create({
    objectHash(obj) {
        const container = obj.containerAssign || 'firefox-default';
        return `${container} ${obj.localIssuer}`;
    },
    textDiff: {
        minLength: Infinity
    }
});

export default diffPatcher;
