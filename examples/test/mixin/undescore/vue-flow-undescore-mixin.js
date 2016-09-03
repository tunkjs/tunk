(function(){

    require()

    Vue.flow.mixin({

        each: function (obj, cb) {
            if (typeof obj === 'object') {
                if (typeof obj.length !== 'undefined') {
                    for (var i = 0, l = obj.length; i < l; i++)
                        if (cb(obj[i], i) === false) break;
                } else for (var x in obj)
                    if (obj.hasOwnProperty(x) && cb(obj[x], x) === false) break;
            } else console.error('argument is wrong');
        },

        map: function (obj, cb) {
            var tmp, result = [];
            this.each(obj, function (value, key) {
                tmp = cb(value, key);
                if (typeof tmp !== 'undefined') result.push(tmp);
            });
            return result;
        },

        find: function (obj, cb) {
            var result;
            this.each(obj, function (value, key) {
                if (cb(value, key)) {
                    result = value;
                    return false;
                }
            });
            return result;
        },

        clone: function (obj) {
            if (typeof obj === 'object')
                return JSON.parse(JSON.stringify(obj));
            else return obj;
        },

    });




})();
