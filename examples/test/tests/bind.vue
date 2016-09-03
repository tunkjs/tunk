<template>
  <test title="Vue.flow.bind 事件绑定" :units='units'>
	  Test : Mixin {{ count }}
  </test>
</template>

<script>

import Vue from 'vue';

//beforeStore beforeFlowIn
Vue.flow.bind('beforeStore',function(newState,oldState){
	//console.log('test:beforeStore',JSON.parse(JSON.stringify({newState,oldState})));
});

Vue.flow.bind('beforeStore',function(newState,oldState){
	//console.log('test2:beforeStore');
});

Vue.flow.bind('beforeFlowIn',function(meta){
	
});
Vue.flow.bind('beforeFlowIn',function(meta){
	
});

Vue.flow.model('bind',{
    default:{
        count: 0,
    },
    click:function(opt){
		return {count:this.getState().count+1};
    },
});

export default {

	data(){
		return {
			units:{
				beforeStore1:false,
				beforeStore2:false,
				beforeFlowIn1:false,
				beforeFlowIn2:false
			}
		};
	},
	components:{
		test:require('./base.vue'),
	},
    flow: {
      count: 'bind.count'
    },
	actions:{
		click:'bind.click',
	},

}
</script>
