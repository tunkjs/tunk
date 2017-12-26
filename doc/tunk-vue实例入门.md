## tunk-vue实例入门

> 本篇教程不对tunk作过多的讲解，若想了解 tunk [请戳这里]()

tunk除了可以跟vue配合，还可以跟react、rn、微信小程序等任何视图框架配合，只需要一个将tunk连接到视图框架的组件。

**tunk-vue** 顾名思义，是让tunk与vue可以一起工作的组件，负责定义视图层如何 **触发Action** 及如何 **将新状态注入到视图组件**。

####A. 如何触发模块的Action

 两种方式：

1. 通过添加`actions`属性向视图组件注入Action代理方法
2. 使用tunk-vue提供的 `this.dispatch('moduleName.actionName', [arg1, arg2, ...])`，支持返回action内执行return的内容，支持Promise 

> 注意： `$dispatch`是vue内置的方法，不带 **$** 的是tunk-vue提供的方法

````html
<template>
  <main>
  	<button v-for="item in list" @click="delTodo(item.id)"> Delete Todo </button>
  	<button @click="addTodo"> Add Todo </button>
  </main>
</template>
<script>
export default {
	data() {
		return {
			inputVal: '',
			list: []
		}
	},
	
	actions: {
		delTodo: 'todo.del'
	},
	
	created() {
		this.fetchTodoList();
	},
	methods: {
		addTodo() {
			this.dispatch('todo.add', this.inputVal);
		},
		async fetchTodoList() {
			this.list = await this.dispatch('todo.fetchList');
		}
	}
}
</script>

````

####B. 如何将Store状态注入到视图组件
两种方式：

1. 通过给组件添加订阅状态属性`state`，设置要订阅的模块状态字段路径
2. tunk-vue提供的 `this.dispatch` 支持获得action方法return的内容

````html
<template>
  <ul>
  	<li v-for="item in list">...</li>
  </ul>
  <button @click="reloadTodoList"> Reload Todo List </button>
</template>
<script>
export default {
	data() {
		return {
			count: 0
		};
	},
	state: {
		// list 是todo定义的状态字段
		list: 'todo.list',
		// list是数组，获取数组第一个元素的id
		theFirstItemId: 'todo.list.0.id'
	},
	methods: {
		async reloadTodoList() {
			const res = await this.dispatch('todo.fetchList');
			this.count = res.total_count;
		}
	}
}
</script>

````

> tunk-vue 在 beforeCreate 事件完成state及action的初始化，在 beforeDestroy 释放相关引用 
> 


### 实例

#### 第一步：引入相关模块
````shell
npm install -S tunk
npm install -S vue
npm install -S tunk-vue
npm install --save tunk-loader
````

#### 第二步：webpack配置
js编译加上 **[tunk-loader]()**

````javascript
{
    test: /\.js$/,
    loader: ['babel-loader','tunk-loader'],
    exclude: /(node_modules)/
}
````

由于要用到ES6的修饰器，需要依赖：babel-plugin-transform-decorators-legacy
 
.babelrc 的plugin加上 “transform-decorators-legacy”

#### 第三步：初始化配置，通常写在应用入口文件

````javascript
//完成vue、tunk、tunk-vue的引入及绑定
import Vue from 'vue';
import tunk from "tunk";
import tunkVue from "tunk-vue";

// tunk使用tunk-vue组件
tunk.use([tunkVue]);
Vue.use(tunk);

// 引入状态管理模块即可完成状态管理模块的初始化
//import './todo';
// 也可批量引入（所有模块都放在根目录下的 modules 文件夹）
var modules = require.context('./modules', true, /\.js$/);
modules.keys().forEach((item) => {
  modules(item);
});
````

#### 第四步：编写模块 todo.js，放置在modules目录

````javascript
import {create, action} from 'tunk';

@create
class todo {
	constructor(){
		this.state = {
			list: this.getFromStorage()
		};
	}
	
	@action
	change(id, text){
		const {list} = this.state;
		for(let i = 0; i < list.length; i++) if(list[i].id === id){
			list[i].text = text;
		}
		this.saveToStorage(list);
		return {list};
	}
	
	@action
	add(text){
		const {list} = this.state;
		list.push(this.make(text));
		this.saveToStorage(list);
		return {list};
	}
	
	@action
	del(id){
		const {list} = this.state;
		for(let i = 0; i < list.length; i++) if(list[i].id === id){
			list.splice(i, 1);
		}
		this.saveToStorage(list);
		return {list};
	}
	
	make(text){
		return {
			id: parseInt(Math.random() * Date.now()),
			text: text || ''
		}
	}
	
	getFromStorage(){
		const list = window.localStorage['todoList'] ? JSON.parse(window.localStorage['todoList']) : [this.make()];
		return {list};
	}
	
	
	saveToStorage(list) {
		list = list || this.state.list;
		window.localStorage['todoList'] = JSON.stringify(list);
	}
}
````

#### 第五步：编写vue组件 Todo.js

````html
<template>
  <main>
  	<button v-for="item in list" @click="delTodo(item.id)"> Delete Todo </button>
  	<button @click="addTodo"> Add Todo </button>
  </main>
</template>
<script>
export default {
	data() {
		return {
			inputVal: '',
			count: 0
		}
	},
	
	state: {
		// list 是todo定义的状态字段
		list: 'todo.list',
		// list是数组，获取数组第一个元素的id
		theFirstItemId: 'todo.list.0.id'
	},
	actions: {
		delTodo: 'todo.del'
	},
	created() {
		this.fetchTodoList();
	},
	methods: {
		addTodo() {
			this.dispatch('todo.add', this.inputVal);
		},
		async fetchTodoList() {
			const res = await this.dispatch('todo.fetchList');
			this.count = res.total_count;
		}
	}
}
</script>

````

[实例源码]()

















