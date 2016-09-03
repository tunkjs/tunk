<template>

	  <p v-for="item in q">{{item.id}} --- {{item.status}} --- <span class="label label-info" v-for="(key,tip) in item">{{key+':'+tip}} -- </span></p>

</template>
<script>

//in request.vue
export default {
    flow: {
		q:'$request.queue'
    },

	ready(){
		
	}
}
</script>
