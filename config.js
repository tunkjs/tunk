var assign = require('./utils/assign')
var configs = require('./vars/configs')
module.exports = function (conf) {
    assign(configs, conf);
    return this;
}