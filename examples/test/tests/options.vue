<template>
  <test title="components 参数 操作" :units='units'>
	  <button @click="inject_action_multi_options(2,2)" class="btn btn-default">inject_action_multi_options</button>
  </test>
</template>

<script>

import {extend, action} from 'tunk';

@extend
class options {
	
	constructor(){

		this.dispatch({t:'default',});

	}
	@action
    test_dispatched (){
		return {t:'dispatched'}
    }
    @action
	test_action_multi_options (a,b){
		this.dispatch('options.test_dispatch_multi_options',a,b);
		return {t:a+'+'+b};
    }
    @action
	test_dispatch_multi_options (a,b){

		return {t:a+'-'+b};
    }
    @action
	test_dispatch (){
		this.dispatch('test_dispatched')
    }
	@action
	test_action(){
		this.dispatch({t:'action'});
	}


}

export default {
    state: {
      t: 'options.t'
    },
	data(){
		return {
			units:{
				'pipes':false,
				'action_inject':false,
				'this_action':false,
				'beforeFlowIn':false,
				'dispatch':false,
				return_despatch:false,
				dispatch_multi_options:false,
				action_multi_options:false,
				inject_action_multi_options:false,
			}
		};
	},
	components:{
		test:require('./base.vue'),
	},

	beforeFlowIn(stateName, value, action){
		console.log('beforeFlowIn(stateName, value, action)',value);
		this.$set('units.beforeFlowIn',true);
		switch(value){
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
			case'2+2':
				this.$set('units.inject_action_multi_options',true);
				break;
		}
		if(action=='options.test_dispatched'){
			this.$set('units.dispatch',true);
		}
	},

	actions:{
		test_dispatch:'options.test_dispatch',
		inject_action_multi_options:'options.test_action_multi_options'
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
		},400);
	}
    
}
</script>
