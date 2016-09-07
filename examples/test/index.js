import 'babel-polyfill';
import Vue from 'vue';
import tunk from "tunk";
import "tunk-vue";
import promiseMiddleware from "tunk-promise-middleware";
import functionMiddleware from "tunk-function-middleware";
import actionMiddleware from "tunk-action-middleware";
import request from "tunk-request";
import cookie from "tunk-cookie";

Vue.use(tunk);

tunk.addMiddleware([actionMiddleware, functionMiddleware, promiseMiddleware]);
tunk.mixin(request());
tunk.mixin(cookie);

new Vue({
    el: 'body',
    components: {
		App:require('./App.vue'),
	}
})
