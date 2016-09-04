var tunk = require('tunk');
var Vue = require('vue');

tunk.install = function (Vue) {

    tunk.__.addStateUpdatedListener(function (targetObject, stateName, newValue, action) {
        if (targetObject.$options.beforeFlowIn)
            targetObject.$options.beforeFlowIn.call(targetObject, stateName, newValue, action);
        targetObject.$set(stateName, newValue);
    });



    Vue.mixin({

        init: function () {
            if (this.$options.state) {
                var initailState = tunk.__.connectState(this, this.$options.state);
                for (var x in initailState) if (initailState.hasOwnProperty(x)) {
                    Vue.util.defineReactive(this, x, initailState[x]);
                }
            }

            if (this.$options.actions) {
                tunk.__.connectActions(this, this.$options.actions);
            }

            tunk.__.connectDispatch(this, 'dispatch');
        },
        beforeDestroy: function () {
            if (this.$options.state) {
                tunk.__.disconnect(this, this.$options.state);
            }
        },
    });
}


