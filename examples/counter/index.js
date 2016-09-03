import 'babel-polyfill';
import Vue from 'vue';
import reflow from "./vue-reflow";
import App from "./components/Counter.vue";
import actionMiddleware from "./vue-flow-action-middleware";

Vue.use(reflow);

reflow.addMiddleware([actionMiddleware]);

require('./reflow/counter2');

new Vue({
    el: 'body',
    components: { App }
})
