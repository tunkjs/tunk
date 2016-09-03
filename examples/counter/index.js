import 'babel-polyfill';
import Vue from 'vue';
import baflow from "baflow";
import "baflow-vue";
import App from "./components/Counter.vue";
import actionMiddleware from "./baflow-action-middleware";

Vue.use(baflow);

baflow.addMiddleware([actionMiddleware]);

require('./baflow/counter2');

new Vue({
    el: 'body',
    components: { App }
})
