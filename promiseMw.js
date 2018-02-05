module.exports = function (dispatch, next, options) {
    return function (obj) {
        if (obj && typeof obj === 'object' && obj.then && typeof obj.then === 'function') {
            return obj.then(function (data) {
                if (typeof data !== 'undefined') {
                    var prevOpts = dispatch.options;
                    dispatch.options = options;
                    var result = dispatch(data);
                    dispatch.options = prevOpts;
                    return result;
                }
            });
        } else return next(arguments);
    };
}
