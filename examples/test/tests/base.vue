<template>
  <section class="alert alert-success" role="alert">
    
	<h4>
			<i class="fa {{ok?'fa-check-circle':'fa-times-circle'}}"></i> {{title}}
	</h4>
	<div class="pull-right">
    	<span class="label {{item?'label-success':'label-danger'}}" v-for='(key, item) in units'>{{key}}</span>
	</div>
	<div>
		<slot></slot>
	</div>
  </section>
</template>
<style>
	section.alert{
		padding:5px !important;
		margin:5px;
		overflow:hidden;
		margin-bottom:5px !important;
	}
	h4{
		display:inline;
		
	}
	span.label{
		margin:0 5px;
		font-size:12px;
		font-weight:normal;
		display:inline-block;

	}
	div{
		margin:5px;
	}
	.label-success{
		color:green;
	}
	.label-danger{
    		color:red;
    	}
</style>
<script>


export default {
	props:{
		title:'',
		units:[],
	},
	data(){
		return {
			ok:false,
		}
	},
	ready(){

		var units=this.units;


		for(var x in units){
			if(!units[x]) {
				this.$set('ok',false);
				return;
			}
		}
		this.$set('ok',true);
	}
}
</script>
