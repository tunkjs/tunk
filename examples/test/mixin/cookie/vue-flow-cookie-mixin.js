(function () {

    function cookie(key, json){
        if (arguments.length > 1 && json!==true)
            return set.apply(cookie, arguments);
        else return get.apply(cookie, arguments);
    }

    function get(key,json) {
        var result;

        if (!key) {
            result = {};
        }

        var cookies = document.cookie ? document.cookie.split('; ') : [];
        var rdecode = /(%[0-9A-Z]{2})+/g;
        var i = 0;

        for (; i < cookies.length; i++) {
            var parts = cookies[i].split('=');
            var cookie = parts.slice(1).join('=');

            if (cookie.charAt(0) === '"') {
                cookie = cookie.slice(1, -1);
            }

            try {
                var name = parts[0].replace(rdecode, decodeURIComponent);
                cookie = cookie.replace(rdecode, decodeURIComponent);

                if (json) {
                    try {
                        cookie = JSON.parse(cookie);
                    } catch (e) {
                    }
                }

                if (key === name) {
                    result = cookie;
                    break;
                }

                if (!key) {
                    result[name] = cookie;
                }
            } catch (e) {
            }
        }

        return result;
    }

    function set(key, value, attributes) {
        var result;


            attributes = Object.assign({
                path: '/'
            }, cookie.defaults, attributes);

            if (typeof attributes.expires === 'number') {
                var expires = new Date();
                expires.setMilliseconds(expires.getMilliseconds() + attributes.expires * 864e+5);
                attributes.expires = expires;
            }

            try {
                result = JSON.stringify(value);
                if (/^[\{\[]/.test(result)) {
                    value = result;
                }
            } catch (e) {
            }

            value = encodeURIComponent(String(value))
                .replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);


            key = encodeURIComponent(String(key));
            key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
            key = key.replace(/[\(\)]/g, escape);

            return (document.cookie = [
                key, '=', value,
                attributes.expires ? '; expires=' + attributes.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
                attributes.path ? '; path=' + attributes.path : '',
                attributes.domain ? '; domain=' + attributes.domain : '',
                attributes.secure ? '; secure' : ''
            ].join(''));

    }

    cookie.set = set;
    cookie.get = get;

    cookie.defaults = {};

    cookie.remove = function (key, attributes) {
        set(key, '', Object.assign({},attributes, {
            expires: -1
        }));
    };


    if (typeof module === 'object' && module.exports) {
        module.exports = {cookie:cookie};
    }
    else if (typeof define === 'function' && define.amd) {
        define(function () {
            return {cookie:cookie};
        })
    }


})();
