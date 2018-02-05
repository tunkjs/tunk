module.exports = function (obj) {
    if (typeof obj === 'object') {
        return JSON.parse(JSON.stringify(obj));
    } else return obj;
}