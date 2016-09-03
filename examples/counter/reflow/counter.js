import Vue from 'vue';

Vue.flow.model('counter',{

    default:{
        count: 0,
    },

    increment:function(opt){
		return {count:this.getState().count+1};
    },

    decrement:function(){
		return {count:this.getState().count-1};
    },

	incrementIfOdd:function(){
		if ((this.getState().count + 1) % 2 === 0) {
			this.dispatch('increment')
		}
    },

	incrementAsync:function(){
		setTimeout(() => {
			this.dispatch('increment')
		}, 1000)
    },

});

