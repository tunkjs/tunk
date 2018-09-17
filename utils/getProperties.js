module.exports = function (clas) {
    var proto = clas.prototype;
    var protos = Object.getOwnPropertyNames(proto), properties;
    while (proto.__proto__ && proto.__proto__.constructor.name !== 'Object') {
        properties = Object.getOwnPropertyNames(proto.__proto__);
        for (var i = 0; i < properties.length; i++) {
            if (protos.indexOf(properties[i]) === -1) protos.push(properties[i]);
        }
        proto = proto.__proto__;
    }
    return protos;
}