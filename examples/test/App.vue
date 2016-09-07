<template>
  <section  v-for="comp in compons">
    <component :is='comp'></component>
  </section>
</template>

<style scoped>



</style>
<script>

var compons = require('./tests/main');

export default {

	data(){
		return {
			compons:Object.keys(compons),
		};
	},

	components:compons,

	created(){
		console.log(compons);
	},

    
}
</script>
