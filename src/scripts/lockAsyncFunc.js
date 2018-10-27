const lockAsyncFunc = (asyncFunc) => {
    // pending, finish
    let status = 'finish';
    const wrapped = async function(...args) {
        status = 'pending';
        await asyncFunc(...args);
        status = 'finish';
    };
    return function(...args) {
        if (status === 'pending') {
            return;
        }
        return wrapped(...args);
    };
};