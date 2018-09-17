var defineHiddenProps = require('./utils/defineHiddenProps')
var assign = require('./utils/assign')
var clone = require('./utils/clone')

function Store() {
    this.state = {};
}
Store.constructor = Store;
defineHiddenProps(Store.prototype, {
    getState: function (path) {
        if (typeof path === 'string') path = path.split('.');
        else if (!path || path.constructor !== Array) throw '[tunk]:wrong argument of getState';
        if (!this.state[path[0]]) throw '[tunk]: unknown module name ' + path[0];
        var state = this.state[path[0]];
        for (var i = 1, l = path.length; i < l; i++) {
            if (path[i] && typeof state === 'object') {
                state = isNaN(path[i]) ? state[path[i]] : (state[parseInt(path[i])] || state[path[i]]);
            }
        }
        return clone(state);
    },
    setState: function (moduleName, state) {
        var keys, keysResult, toUpdate;
        if (this.state[moduleName]) {
            keys = Object.keys(this.state[moduleName]);
            keysResult = Object.keys(state);
            toUpdate = {};

            for (var i = 0; i < keysResult.length; i++)
                if (keys.indexOf(keysResult[i]) > -1)
                    toUpdate[keysResult[i]] = state[keysResult[i]];

            assign(this.state[moduleName], clone(toUpdate));
            return toUpdate;

        } else if (state) {
            this.state[moduleName] = assign({}, clone(state));
            return state
        }
    }
});

module.exports = Store;
