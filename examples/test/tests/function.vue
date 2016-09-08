<template>
  <test title="Function 中间件" :units='units'>
  </test>
</template>

<script>

import baflow from 'baflow';

baflow.model('function',{
	
	default:{
		t:'default',
	},

	test_dispatch: function(){
	   this.dispatch(function(state){
		   this.dispatch({t:'dispatch'});
	   });
	},

	test_return : function(opt){
		return function(state){
			console.log(state);
			return {t:opt};
		};
    },


});

export default {
    flow: {
      t: 'function.t'
    },
    actions:{
        test_dispatch:'function.test_dispatch',
		test_return:'function.test_return',
    },
	data(){
		return {
			units:{
                dispatch:false,
                return:false,
			}
		};
	},
	beforeStateInject(meta){
	    if(meta.value==='dispatch') this.$set('units.dispatch',true);
	    if(meta.value==='return') this.$set('units.return',true);
	},
	components:{
		test:require('./base.vue'),
	},

	ready(){
        this.dispatch('function.test_dispatch');
		this.dispatch('function.test_return','return');
	}
    
}
</script>
