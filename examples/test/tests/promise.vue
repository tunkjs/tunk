<template>
  <test title="Promise 中间件" :units='units'>
    <button class="btn btn-default" @click="test_define">test</button>
  </test>
</template>

<script>

import Vue from 'vue';

Vue.flow.model('promise',{
	
	default:{
		t:'default',
	},

	test_define:async function(){
	    var dispatch=this.dispatch;
        var t=await (()=>{
            return new Promise(function(resolve,reject){
                setTimeout(()=>{
                    resolve('define');
                    dispatch('promise.test_return');
                },100);
            });
        })();

        return {t};
	},

	test_return : function(){
       return async function(){
            var t=await (()=>{
                return new Promise(function(resolve,reject){
                    setTimeout(()=>{
                        resolve('return');
                    },200);
                });
            })();
            return {t};
       };
    },


});

export default {
    flow: {
      t: 'promise.t'
    },
    actions:{
        test_define:'promise.test_define'
    },

	data(){
		return {
			units:{
                define:false,
                return:false,
			}
		};
	},
	beforeFlowIn(meta){
	    if(meta.value==='define') this.$data.units.define=true;
	    if(meta.value==='return') this.$data.units.return=true;
	},
	components:{
		test:require('./base.vue'),
	},

	ready(){
        this.$action('promise.test_define');
	}
    
}
</script>
