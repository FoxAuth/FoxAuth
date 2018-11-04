;
(function(global) {
    const diffPatcher = jsondiffpatch.create({
        objectHash(obj) {
            const container = obj.containerAssign || 'firefox-default';
            return `${container} ${obj.localIssuer}`;
        },
        textDiff: {
            minLength: Infinity
        }
    });

    global.diffPatcher = diffPatcher;
})(this);
