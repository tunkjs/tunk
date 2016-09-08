import 'babel-polyfill';
import Vue from 'vue';
import tunk from "tunk";
import "tunk-vue";
import actionMiddleware from "tunk-action-middleware";
import App from "./components/Counter.vue";


Vue.use(tunk);

tunk.addMiddleware([actionMiddleware]);

require('./modules/counter');
require('./modules/counterText');

new Vue({
    el: 'body',
    components: { App }
})
