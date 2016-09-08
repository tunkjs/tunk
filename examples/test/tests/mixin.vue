<template>
  <div>
    Test : Mixin {{ count }}
    <button @click="click">+</button>
  </div>

</template>

<script>

import baflow from 'baflow';

//beforeStore beforeStateInject
baflow.bind('beforeStore',function(newState,oldState){
	console.log('test:beforeStore',JSON.parse(JSON.stringify({newState,oldState})));
});

baflow.bind('beforeStore',function(newState,oldState){
	console.log('test2:beforeStore');
});

baflow.bind('beforeStateInject',function(meta){
	console.log('test:beforeStateInject',{meta,comp:this});
});
baflow.bind('beforeStateInject',function(meta){
	console.log('test2:beforeStateInject');
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
    flow: {
      count: 'bind.count'
    },
	actions:{
		click:'bind.click',
	},
	ready(){
		
	}
}
</script>
