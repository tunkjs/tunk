import Vue from 'vue';
import baflow from "baflow";
import "baflow-vue";
import promiseMiddleware from "./middlewares/promise/vue-flow-promise-middleware";
import functionMiddleware from "./middlewares/function/vue-flow-function-middleware";
import actionMiddleware from "./middlewares/action/vue-flow-action-middleware";
import request from "./mixin/request/vue-flow-request-mixin";
import cookie from "./mixin/cookie/vue-flow-cookie-mixin";

Vue.use(baflow);

Vue.flow.addMiddleware([actionMiddleware, functionMiddleware, promiseMiddleware]);
Vue.flow.mixin(request());
Vue.flow.mixin(cookie);

new Vue({
    el: 'body',
    components: { 
		App:require('./App.vue'),
	}
})
