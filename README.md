
<div style="text-align:center; margin-bottom:50px;">
<img style="width: 200px;" src="https://github.com/tunkjs/gitbook-tunkjs/blob/master/img/logo.png?raw=true" alt="tunk logo">
</div>

# tunk
实现了交互逻辑和数据处理逻辑轻松解耦的应用状态管理框架。

你需要面向业务数据逻辑对象来设计状态管理模块，并且仅能由所属模块定义的Action去更新所属模块定义的状态，而模块实际不存储状态数据，这样的机制利于代码职责的划分及控制不可预知的状态变化。

对于视图组件来说，tunk提供的是一个数据服务，组件可以轻松订阅需要的数据，也可以主动获取Action返回的处理结果。

#### 安装

````
npm install tunk
````

### 一、实例

1、tunk模块的创建

````javascript
// 一个用户管理模块
import {create, action} from 'tunk'
// 创建模块类实例
@create
class userAdmin {
	constructor(){
		// 定义存储到store相关节点的状态字段 list
		this.state = {
			list:[]
		}
	}
	@action
	fetchList(param){
		const res = this.request ...
		// 将list新状态更新到store
		// totalCount由于未在constructor中被定义为状态字段
		// 因此totalCount不会被保存到store
		return {list: res.list, totalCount: res.total_count}
	}
	@action 
	addUser(){
		...
	}
	// 非action方法
	someFunc(){
		...
	}
	...
}

````

> 状态管理模块与视图组件是并非一对一的关系，所有状态管理模块共同组成了一个数据服务层，视图组件可以订阅任意模块的状态数据。

2、以vue作实例说明，让视图组件订阅上面模块定义的list状态字段，以及调起该模块的Action fetchList


````html
// vue视图组件（tunk-vue）
<template>
  <ul>
  	<li v-for="item in list"></li>
  </ul>
  ...
</template>
<script>
export default {
	// 状态订阅配置
	state: {
		// list 是userAdmin定义的状态字段
		// 组件被初始化后this.list将被注入当前 userAdmin.list 的状态
		list: 'userAdmin.list'
	},
	data() {
		return {
			count: 0
		};
	},
	created(){
		this.loadUserList();
	}
	methods: {
		async loadUserList() {
			const result = await this.dispatch('userAdmin.fetchList');
			// userAdmin模块的action：fetchList ，返回了{list, totalCount};
			// 虽然totalCount没被保存到store
			// totalCount仍然可以在 this.dispatch('userAdmin.fetchList') 返回的结果中使用
			// 同时在state配置的订阅状态也会被注入
			this.count = result.totalCount;
		}
	}
}
</script>
````
3、下面是tunk在程序入口文件的初始化

````javascript
import Vue from 'vue';
import tunk from "tunk";
import tunkVue from "tunk-vue";

// tunk使用tunk-vue组件
tunk.use([tunkVue]);
Vue.use(tunk);

// 引入状态管理模块即可创建状态管理模块
//import './userAdmin';
// 也可批量引入（通常我们都把模块js放到统一目录下，如：modules）
var modules = require.context('./modules', true, /\.js$/);
modules.keys().forEach((item) => {
  modules(item);
});

````

#### 要点
1、一个模块对应着store状态树的一个节点，一个store状态节点仅能被对应的模块更新

2、视图组件并没直接依赖tunk模块，而是相当于面向一个数据服务进行通信

3、你需要面向数据逻辑对象来设计状态管理模块类，将不同数据源的数据处理逻辑集中到状态管理模块类里，视图组件只负责内容展示和交互处理

4、视图组件可以轻松订阅不同模块的状态数据，也可以通过调起action的方法获得其返回的所有数据。

> 你不需要将所有用到的数据都视定义为状态数据，不会被复用的数据不应定义为状态 
> 
> 由于可获得action返回的所有内容，你不需要为了使用一次的数据做繁琐的状态数据定义与绑定操作
> 
> 推荐你将所有的数据处理逻辑都放在在模块内，这样可以减轻视图层的复杂度，视图层仅负责内容展示及交互的逻辑处理
> 

5、tunk模块完全跟视图层无关，同一份tunk模块，可以直接配合不同的视图层的实现，譬如wap版开发完，复用tunk模块，只需要实现小程序的视图层即可完成小程序的开发

### 二、基本概念

#### Store 
存储状态树数据，提供tunk内部读取和更新状态树数据的方法。
> tunk默认使用的是内置的Store对象，你也可以使用自定义的Store对象来改变数据存储、读取方式
> 
> 对常规业务开发是透明的，仅在扩展组件的开发中暴露store相关接口

[开发自定义Store对象](https://github.com/tunkjs/tunk/blob/master/doc/%E5%BC%80%E5%8F%91%E8%87%AA%E5%AE%9A%E4%B9%89Store%E5%AF%B9%E8%B1%A1.md)

#### State
读取自store的状态快照，修改state将不会影响到store存储的数据

> 在constructor内赋给this.state的对象字段作为定义该模块的状态字段，后续的状态维护将不会再创建新状态字段，
> 
> 模块内部可通过`this.state`和`this.getState()`读取当前模块的state，向`this.getState()`传入参数，也可获得其他模块的state
> 
> 使用tunk-vue 或 tunk-react的时候，state也会被注入到订阅了特定模块的state的视图组件

#### Module(模块)
负责定义初始化状态数据及维护这些数据的Action集合，是一个Store数据树子集数据的处理类的实例化对象。
> 通过`@create`或`tunk.createModule()`创建并实例化
> 
> constructor内定义的this.state的对象作为Store内同类名节点的初始数据
> 
> 一个模块负责管理Store数据树的一个子集

#### Action 
模块类中使用`@action`修饰的方法，唯一可触发Store状态变化的方式。
> Action通过return返回的数据和dispatch方法传入的数据都会先经过 [中间件](https://github.com/tunkjs/tunk/blob/master/doc/tunk%E4%B8%AD%E9%97%B4%E4%BB%B6%E7%9A%84%E4%BD%9C%E7%94%A8%E5%8F%8A%E5%A6%82%E4%BD%95%E5%BC%80%E5%8F%91%E4%B8%9A%E5%8A%A1%E4%B8%AD%E9%97%B4%E4%BB%B6.md) 的处理，最后可能会触发State的变化
> 
> 支持异步Action，避免过多函数嵌套

````javascript
	@action
	async fetchList(page, page_size){
		const res = await this.request ...
		return {list: res.list, totalCount: res.total_count}
	}
````

> Action内调其他Action

````javascript
	
	@action 
	addUser(gender, name, age){
		//调起当前模块的其他Action跟调普通方法无异
		this.fetchList(page, page_size);
		this.dispatch('fetchList', page, page_size);
		this.dispatch('userAdmin.fetchList', page, page_size);
		//调起其他模块的Action
		this.dispatch('moduleName.actionName', [param1, param2, ...]);
	}
````

> 在异步Action调起其他Action，可获得被调用Action return返回的结果，此时，store已经完成状态的更新

````javascript
	//异步Action
	@action 
	async deleteUser(){
		//可获得Action执行return的结果
		const result1 = await this.fetchList(page, page_size);
		const result2 = await this.dispatch('fetchList', page, page_size);
		const result3 = await this.dispatch('userAdmin.fetchList', page, page_size);
		//调起其他模块的Action
		const result4 = await this.dispatch('moduleName.actionName', [param1, param2, ...]);
		
	}
````



### 三、工作流程

<div style="text-align:center;">
<img src="https://github.com/tunkjs/tunk/blob/master/doc/tunk-flow.png?raw=true" alt="tunk flow">
</div>

1. 视图层触发交互事件
1. 交互事件回调发起Action执行
1. 执行Action
1. Action返回的结果或dispatch的数据，进入中间件处理流程
1. 满足一定条件进入到内置store中间件后，调起setStore钩子
1. setStore钩子执行Store对象提供的方法 store.setState 将定义为状态的字段数据存储到store，并返回action执行返回的所有数据
1. 让视图框架跟tunk一起工作的组件（如tunk-vue）切入setStore钩子获得状态更新的通知
1. 在切入setStore钩子的回调，获取到新状态并找到绑定了新状态相关字段的视图组件，将新状态数据逐一注入其中



### 四、tunk API

#### tunk.use(plugins:Array)
> 使用tunk组件，了解tunk组件开发，可戳这里 [tunk组件开发](https://github.com/tunkjs/tunk/blob/master/doc/tunk%E7%BB%84%E4%BB%B6%E5%BC%80%E5%8F%91.md) 

````javascript
import tunk from "tunk";
import tunkVue from "tunk-vue";
import tunkDebug from "tunk-debug";
tunk.use([tunkVue, tunkDebug]);
````
#### tunk.config(configs:Object)
> tunk全局配置

````javascript
// debug配置由debug组件提供支持，设为true可查看全局相关debug log
tunk.config({debug:true});
````

#### @create([moduleName:String, options:Object])
> create修饰器，用于重构模块类及生成模块实例
> 
> **moduleName**：由于UgligyJS会将类名压缩，因此没使用tunk-loader的话需要传入需要创建的模块名
> 
> **options**：为模块级别的配置，将覆盖全局配置中同名字段的配置
> 
> 如仅查看某个action的相关debug log: 

````javascript:
tunk.config({debug:false});
// 在特定的模块create修饰器传入即可

@create({debug: true})
class someModule{
	...
}
````

#### @action([options:Object])
> action修饰器，用于定义一个方法为一个Action
> 
> **options**：为action级别的配置，将覆盖模块配置中同名字段的配置
> 
> 跟全局配置与模块配置的关系，相当于
> 
> `Object.assign(globalConfig, moduleConfig, actionConfig)`
> 
> 如仅查看某个action的相关debug log: `@action({debug: true})`

#### tunk.createModule(moduleName:String, module:Object, [options:Object])
> 若语法环境不支持修饰器的写法，tunk还提供了ES5写法
> 
> **moduleName**：模块名
> 
> **module**：模块对象，对象必须有constructor方法
> 
> **options**：模块配置，同@create(options) 作用一致

````javascript
tunk.createModule('userAdmin', {
	constructor: function userAdmin(){
		this.state = {
			list:[]
		};
	}
}, {debug:true});
````

#### tunk.createAction(target:Function, [options:Object])
> 跟tunk.createModule配合使用，定义一个方法为Action
> 
> **target**：需要被定义为Action的函数
> 
> **options**：action级别的配置，同@action(options) 作用一致

````javascript
tunk.createModule('userAdmin', {
	constructor: function userAdmin(){
		this.state = {
			list:[]
		};
	},
	fetchList: tunk.creatAction(function(){
		...
	}, {debug: true}),
});
````

### 五、模块API
#### this.state
> 在constructor内可同步设置初始状态数据
> 初始化之后为只读属性，读取当前模块所维护的状态，二次赋值将报错
> this.state实际不存储状态，读取的数据都来自store字段名为模块名的节点

#### this.getState([statePath:string])
> `this.getState()` 不传参数读取的是当前模块的状态
> 
> `this.getState('userAdmin')` 获取模块名为'userAdmin'的模块负责维护的所有状态
> 
> `this.getState('userAdmin.list')` 获取模块名为'userAdmin'的模块字段名为'list'的状态
> 
> `this.getState('userAdmin.list.0.id')` 获取模块名为'userAdmin'的模块字段名为'list'的数据是一个数组，那么将读取这个数组第一个元素的id
> 
> 这种对象深度读取的方式由tunk内置的Store对象提供，最多可读取深度为5的数据

#### this.dispatch([arg1, arg2, arg3...])
> dispatch分发数据到中间件，的功能由中间件提供
> tunk有两个内置中间件：调起action中间件，保存状态中间件
> > 
> > 调起action中间件：
> > 
> > > `this.dispatch(actionPath:String, [arg1, arg2...])`
> > 
> > > **actionPath**：由模块名和action名组成，如：'userAdmin.fetchList'，也可直接写，如果是当前模块的action，可直接写action名如：‘fetchList’。
> > 
> > > **args**：支持向fetchList传入多个参数
> > 
> > 状态保存中间件：
> > 
> > > `this.dispatch(newState:Object)`
> > > 
> > > **newState** 如果判断到传入的是一个参数且为Object类型，将会通过该中间件保存到store中
> 

[关于tunk中间件的作用及如何开发业务中间件]()

#### return in Action
> action方法return的内容，自动跑dispatch流程，相当于 `this.dispatch(obj)`
> 
> 通常return的是Object类型参数，通过**状态保存中间件**更新到store被当前模块维护的节点中

#### methods in module
> 当前模块的action及非action方法都可以直接用`this.method([arg1, arg2...])`的方式调起

#### mixin methods
> 由组件提供的模块通用内置方法，如何添加mixin方法，请查看 [tunk组件开发](https://github.com/tunkjs/tunk/blob/master/doc/tunk%E7%BB%84%E4%BB%B6%E5%BC%80%E5%8F%91.md) 



### 六、相关入门

[tunk-vue实例入门](https://github.com/tunkjs/tunk/blob/master/doc/tunk-vue%E5%AE%9E%E4%BE%8B%E5%85%A5%E9%97%A8.md)

[tunk-react实例入门](https://github.com/tunkjs/tunk/blob/master/doc/tunk-react%E5%AE%9E%E4%BE%8B%E5%85%A5%E9%97%A8.md)

### 七、tunk深入详解

[tunk组件开发](https://github.com/tunkjs/tunk/blob/master/doc/tunk%E7%BB%84%E4%BB%B6%E5%BC%80%E5%8F%91.md) 

[tunk中间件的作用及如何开发业务中间件](https://github.com/tunkjs/tunk/blob/master/doc/tunk%E4%B8%AD%E9%97%B4%E4%BB%B6%E7%9A%84%E4%BD%9C%E7%94%A8%E5%8F%8A%E5%A6%82%E4%BD%95%E5%BC%80%E5%8F%91%E4%B8%9A%E5%8A%A1%E4%B8%AD%E9%97%B4%E4%BB%B6.md)

[开发自定义Store对象](https://github.com/tunkjs/tunk/blob/master/doc/%E5%BC%80%E5%8F%91%E8%87%AA%E5%AE%9A%E4%B9%89Store%E5%AF%B9%E8%B1%A1.md)

[tunk性能优化](https://github.com/tunkjs/tunk/blob/master/doc/tunk%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96.md)

### 八、组件推荐

[tunk-vue](https://github.com/tunkjs/tunk-vue)

[tunk-react](https://github.com/tunkjs/tunk-react)

[tunk-request](https://github.com/tunkjs/tunk-request)

[tunk-loader](https://github.com/tunkjs/tunk-loader)

[tunk-debug](https://github.com/tunkjs/tunk-debug)
















