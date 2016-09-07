<template>
  <test title="request" :units='units'>
	  <b>pending:{{p}} ---</b>
	  <queue v-if='show'></queue>
  </test>
</template>

<script>

import {extend, action} from 'tunk';


@extend
class request {
    constructor(){
		this.dispatch({
			t: '',
		});
    }
    @action
	test_jsonp(){
		var self = this;
		var jsonp = this.jsonp('/jsonp',function(v){if(v.data) self.dispatch({t:'jsonp'});});
	}
	@action
	async test_jsonp_promise (){
		var jsonp = await this.jsonp('jsonp',function(v){});
		if(jsonp.data) return {t:'jsonp_promise'};
	}
	@action
	test_jsonp_abort(){
		var self = this;
		var jsonp = this.jsonp('jsonp',function(v){},function(e){
			//console.log('test_jsonp_abort',arguments);
			self.dispatch({t:'jsonp_abort'});
		});
		jsonp.xhr.abort();
	}
	@action
	test_json(){
		var self = this;
		var json = this.getJson('/api',function(v){if(v.data) self.dispatch({t:'json'});});
	}
	@action
	async test_json_promise (){
		var json = await this.getJson('/api',function(v){});
		if(json.data) return {t:'json_promise'};
	}
	@action
	test_json_abort(){
		var self = this;
		var json = this.getJson('/api',function(v){},function(e){
			//console.log('test_json_abort',arguments);
			self.dispatch({t:'json_abort'});
		});
		json.xhr.abort();
	}
	@action
	test_$request_model(){
		var self = this;
		var json = this.request({
			url:'/api',
			extra:{
				timeout:3,
				success:'成功',
				error:'失败',
				pending:'加载中...',
			},
			success:function(v){
				setTimeout(()=>{
					console.log(json);
					self.dispatch('REQUEST.remove',json.id);
					self.dispatch({t:'request_model_remove'});
				},2000);
			},
		});
	}

}

export default {
	state:{
		t:'request.t',
		p:'REQUEST.pending',
		q:'REQUEST.queue'
	},
	actions:{
		jsonp:'request.test_jsonp',
		jsonp_promise:'request.test_jsonp_promise',
		jsonp_abort:'request.test_jsonp_abort',
		json:'request.test_json',
		json_promise:'request.test_json_promise',
		json_abort:'request.test_json_abort',
		request_model_remove:'request.test_$request_model',
	},


	data(){
		return {
			units:{
				jsonp:false,
				jsonp_abort:false,
				jsonp_promise:false,
				json:false,
				json_promise:false,
				json_abort:false,
				request_model_remove:false,
			},
			show:true,
		};
	},

	watch:{
		t:function(v){
			this.$set('units.'+v,true);
		}
	},

	components:{
		queue:require('./destroy.vue'),
		test:require('./base.vue'),
	},

	ready(){
		var self = this;
		this.jsonp();
		this.jsonp_promise();
		this.jsonp_abort();
		this.json();
		this.json_promise();
		setTimeout(function(){
			self.json_abort();
		},10);
		setTimeout(function(){
			self.request_model_remove();
		},2000);

		setTimeout(()=>{
			self.$set('show',!self.$data.show);
		},5000);
	}
}
</script>
