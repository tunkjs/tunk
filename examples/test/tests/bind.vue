<template>
  <test title="baflow.bind 事件绑定" :units='units'>
	  Test : Mixin {{ count }}
  </test>
</template>

<script>

import baflow from 'baflow';

//beforeStore beforeStateInject
baflow.bind('beforeStore',function(newState,oldState){
	//console.log('test:beforeStore',JSON.parse(JSON.stringify({newState,oldState})));
});

baflow.bind('beforeStore',function(newState,oldState){
	//console.log('test2:beforeStore');
});

baflow.bind('beforeStateInject',function(meta){
	
});
baflow.bind('beforeStateInject',function(meta){
	
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
				beforeStateInject1:false,
				beforeStateInject2:false
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
