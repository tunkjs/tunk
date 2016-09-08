<template>
  <test title="components 参数 操作" :units='units'></test>
</template>

<script>

import baflow from 'baflow';

baflow.model('options',{
	
	default:{
		t:'default',
	},

    test_dispatched:function(){
		return {t:'dispatched'}
    },


	test_dispatch_multi_options:function(a,b){

		return {t:a+'-'+b};
    },

	test_dispatch:function(){
		this.dispatch('test_dispatched')
    },


});

export default {
    flow: {
      t: 'options.t'
    },
	data(){
		return {
			units:{
				'dispatch':false,
				return_:false,
				multi_params:false,
			}
		};
	},
	components:{
		test:require('./base.vue'),
	},

	beforeStateInject(meta){
		this.$set('units.beforeStateInject',true);
		switch(meta.value){
			case'action':
			this.$set('units.this_action',true);
			break;
			case'dispatched':
			this.$set('units.return_despatch',true);
			break;
			case'1+2':
			this.$set('units.action_multi_options',true);
			break;
			case'1-2':
			this.$set('units.dispatch_multi_options',true);
			break;
		}
		if(meta.action=='options.test_dispatched'){
			this.$set('units.dispatch',true);
		}
	},

	action:{
		test_dispatch:'options.test_dispatch',
	},

	ready(){
		if(this.t==='default') this.$set('units.pipes',true);
		if(this.test_dispatch) this.$set('units.action_inject',true);
		setTimeout(()=>{
			this.test_dispatch();
		},200);
		setTimeout(()=>{
			this.dispatch('options.test_action');
		},100);

		setTimeout(()=>{
			this.dispatch('options.test_action_multi_options','1','2');
		},100);
	}
    
}
</script>
