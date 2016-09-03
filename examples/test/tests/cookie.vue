<template>
  <test title="cookie" :units='units'>
  </test>
</template>

<script>

import Vue from 'vue';

Vue.flow.model('cookie',{
    default:{
        t: '',
    },
	test_cookie_get: async function(){
		if(this.cookie.get('t')) return {t:'cookie_get'};
	},
	test_cookie_set: async function(){
		this.cookie.set('t',{a:1});
		if(this.cookie.get('t')) return {t:'cookie_set'};
	},
	test_cookie_getjson: async function(){
		var t = this.cookie.get('t',true);
		if(t.a) return {t:'cookie_getjson'};
	},
	test_cookie_remove: function(){
		this.cookie.remove('t');
		setTimeout(()=>{
			if(!this.cookie.get('t'))
				this.dispatch({t:'cookie_remove'})
		},10);
	},

});

export default {
	flow:{
		t:'cookie.t'
	},
	actions:{
		cookie_get:'cookie.test_cookie_get',
		cookie_set:'cookie.test_cookie_set',
		cookie_getjson:'cookie.test_cookie_getjson',
		cookie_remove:'cookie.test_cookie_remove',

	},
	data(){
		return {
			units:{
				cookie_get:false,
				cookie_set:false,
				cookie_getjson:false,
				cookie_remove:false,
				
			}
		};
	},
	watch:{
		t:function(v){
			this.$set('units.'+v,true);
		}
	},
	components:{
		test:require('./base.vue'),
	},

	ready(){
		this.cookie_set();
		this.cookie_get();
		this.cookie_getjson();
		this.cookie_remove();
		
	}
    

}
</script>
