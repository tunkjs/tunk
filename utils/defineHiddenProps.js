module.exports = function (obj, props) {
    for (var x in props) {
        Object.defineProperty(obj, x, {
            value: props[x],
            enumerable: false,
            writable: false,
            configurable: false
        });
    }
}