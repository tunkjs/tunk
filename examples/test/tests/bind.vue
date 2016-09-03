<template>
  <test title="baflow.bind 事件绑定" :units='units'>
	  Test : Mixin {{ count }}
  </test>
</template>

<script>

import baflow from 'baflow';

//beforeStore beforeFlowIn
baflow.bind('beforeStore',function(newState,oldState){
	//console.log('test:beforeStore',JSON.parse(JSON.stringify({newState,oldState})));
});

baflow.bind('beforeStore',function(newState,oldState){
	//console.log('test2:beforeStore');
});

baflow.bind('beforeFlowIn',function(meta){
	
});
baflow.bind('beforeFlowIn',function(meta){
	
});

@extend
class bind {
    constructor(){
        this.dispatch({
            count:0
        });
    }
    @action
    click(opt){
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
