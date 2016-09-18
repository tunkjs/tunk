<template>
  <test title="Promise 中间件" :units='units'>
    <button class="btn btn-default" @click="test_define">test</button>
  </test>
</template>

<script>


import {create, action} from 'tunk';


@create
class promise {
    constructor(){
		this.state=({
			t:'default',
		});
    }

    @action
	async test_define(){
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
	}

    @action
	test_return(){
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
    }


}

export default {
    state: {
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

	beforeStateInject(stateName, newState, action){
	    if(newState==='define') this.$data.units.define=true;
	    if(newState==='return') this.$data.units.return=true;
	},
	components:{
		test:require('./base.vue'),
	},

	ready(){
        this.dispatch('promise.test_define');
	}
    
}
</script>
