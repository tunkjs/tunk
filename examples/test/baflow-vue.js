var baflow = require('baflow');

baflow.install = function (Vue) {

    baflow.__.addStateUpdatedListener(function (targetObject, stateName, newValue, action) {
        if (targetObject.$options.beforeFlowIn)
            targetObject.$options.beforeFlowIn.call(targetObject, stateName, newValue, action);
        targetObject.$set(stateName, newValue);
    });



    Vue.mixin({

        init: function () {
            if (this.$options.state) {
                var initailState = baflow.__.connectState(this, this.$options.state);
                for (var x in initailState) if (initailState.hasOwnProperty(x)) {
                    Vue.util.defineReactive(this, x, initailState[x]);
                }
            }

            if (this.$options.actions) {
                baflow.__.connectActions(this, this.$options.actions);
            }

            baflow.__.connectDispatch(this, 'dispatch');
        },
        beforeDestroy: function () {
            if (this.$options.state) {
                baflow.__.disconnect(this, this.$options.state);
            }
        },
    });
}


