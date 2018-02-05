module.exports = function () {
    var args = arguments;
    for (var i = 0, l = args.length; i < l; i++) {
        if (args[i + 1] && typeof args[i + 1] === 'object') for (var x in args[i + 1]) {
            args[0][x] = args[i + 1][x];
        }
    }
    return args[0];
}
