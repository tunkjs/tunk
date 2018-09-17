
var middlewares = require('./vars/middlewares');

/**
 * utils.addMiddleware([function (dispatch, next, options) {
        return function () {
            return next(arguments);
        }
    }]);
*/
function addMiddleware(middleware) {
    if (typeof middleware === 'function') middlewares.push(middleware);
    return this;
}

addMiddleware.__reset = function () {
    while (middlewares.length > 1) middlewares.pop();
}

module.exports = addMiddleware;