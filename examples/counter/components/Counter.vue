<template>
  <div>
    Clicked: {{ count }} : times
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
    <button @click="incrementIfOdd">Increment if odd</button>
    <button @click="incrementAsync">Increment async</button>
    <br/> <br/> {{ text }}
  </div>
</template>

<script>
'use strict';
export default {
	replace:true,
    state: {
      count: 'counter.count',
      text:'counterText.text'
    },
    actions:{
    	increment:'counter.increment',
    	decrement:'counter.decrement',
    	incrementIfOdd:'counter.incrementIfOdd',
    },
	ready(){
		console.log(this,this.state,this.props);
	},
    methods:{
		incrementAsync(){
			this.dispatch('counter.incrementAsync');
		}
	}
}
</script>
