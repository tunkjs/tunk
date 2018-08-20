
<div style="text-align:center; margin-bottom:50px;">
<img style="width: 200px;" src="https://github.com/tunkjs/gitbook-tunkjs/blob/master/img/logo1x.png?raw=true" alt="tunk logo">
</div>


#### tunkjs是一个具有状态管理功能的前端架构优化框架，提供了一个让数据处理逻辑与交互逻辑完美解耦与灵活通信的模式。 

### 开发初衷

tunk旨在优化前端架构、提高开发体验、掰直学习曲线、降低web前端项目开发维护成本，为此做了一定的封装让其拥有必要的特性、减少特有的规则及编码细节、精简接口，入门只需要掌握几个方法的使用便可接手tunk架构项目的业务开发。

tunk架构下，你的**前端代码一般会被分为两层：数据服务层与视图表现层**，数据服务层由N个**数据服务模块**组成，视图层由仅仅负责数据展现与交互处理。视图组件面向数据服务层进行通信，包括发起服务模块的action执行，以及订阅状态更新。

接到一个业务需求你通常要做两件事，一个是根据业务需求和接口的数据逻辑**设计模块类**，另一件事是**写视图组件**。

tunk尽可能精简要暴露的API及处理的细节，让框架自身存在感更低，让你轻松上手，专注于业务的实现。

通过限制模块更新状态树的范围，无需向store描述变更，状态变更也完全可预测。

### 安装

````javascript
npm install tunk -S
````
除了tunk你还需要安装**视图框架绑定组件**

跟vue绑定

````javascript
npm install tunk-vue -S
````
跟react或react native绑定

````javascript
npm install tunk-react -S
````
跟微信小程序绑定

````javascript
npm install tunk-wechat -S
````

### 实例

----

> 场景：开发一个用户管理列表，列表中弹框查看用户详细信息

### 写个数据服务模块

````javascript
import {create, action} from 'tunk'
// 创建userAdmin服务模块
@create 
class userAdmin {
	constructor(){
                // state属性仅用于在构造器中定义当前模块负责维护的状态字段
                // 服务模块被创建后，Store状态树创建'userAdmin'节点，节点初始内容来自state
                // 下面仅定义list为【状态字段】
                this.state = {
                        list:[]
                }
        }
        // @action 定义一个请求用户列表数据的Action
        // 只有userAdmin模块的action可以更新'userAdmin'节点的状态
        // 并且只能更新已存在的状态字段，即 list 字段
	@action
	fetchList(param){
                // request 是tunk-request组件提供的模块内置方法
		const res = this.request(...);
        
                // 返回的结果可更新Store状态树 userAdmin 节点下的list字段，触发状态变更钩子
		return {list: res.list};
	}
	@action
	async getUserDetails(id){
		const res = await this.request(...);
                // details没有定义为状态字段，action处理结果的details字段不会更新到Store中
                // 发起的action执行可获得返回结果，如：
                // const details = await this.getUserDetails(id).details;
		return {details: res.data};
	}

	someFunc(){
                // 获取当前模块的状态
		const state = this.getState();
	}
	...
}
````

如果你的构建环境不支持修饰器和async/await，譬如微信小程序，你可以这样写一个模块

````javascript
// 注意：这里首字母大写
import {Create, Action} from 'tunk'

Create('userAdmin', {
	// 注意：构造器 采用constructor(){}的写法会导致意外出错
	constructor: function(){
		this.state = {
			list:[]
		};
	},
	fetchList: Action(function(param) {
        return this.request(...).then((res)=>{
				return {list: res.list};
			});
		});
	},
	getUserDetails: Action(function(id){
		return this.request(...).then((res)=>{
			return {details: res.data};
		});
	}),
	someFunc(){
		const state = this.getState();
	}
	...
});
````

----

### 下面开发个视图组件

**tunk与视图框架配合工作，需要跟视图框架绑定的组件，如tunk-vue、tunk-react、tunk-wechat**

这些绑定组件负责定义视图组件如何 **触发Action** 及如何 **将新状态注入到视图组件**。

下面你可以挑你要用到的视图框架的实例来阅读

#### Vue
````html
<template>
  <ul>
	  <li v-for="item in list">
		 ...
		 <button @click="showUserDetails(item.id)">查看用户信息</button> 
	  </li>
  </ul>
  ...
</template>
<script>
export default {
	// 状态订阅配置
	state: {
		// list 是模块userAdmin定义的状态字段，可以被视图组件订阅
		// 组件被初始化后this.list将被注入当前 userAdmin.list 的状态
		list: 'userAdmin.list'
	},
	// 代理action设置
	actions:{
		// 创建getDetails方法可调起模块的getUserDetails
		getDetails: 'userAdmin.getUserDetails',
	},
	created(){
		// 通过dispatch方式调起action
		this.dispatch('userAdmin.fetchList');
	},
	methods:{
		async showUserDetails(id){
			// 调用action代理方法，并获得action执行结果
			const details = await this.getDetails(id).details;
			// 也可以通过dispatch调起action
			// const details = await this.dispatch('userAdmin.getUserDetails', id).details;
		}
	}
}
</script>
````

> 

#### React
````javascript
import { connect } from 'tunk-react'
@connect({ // 状态订阅配置
	// list 是模块userAdmin定义的状态字段，可以被视图组件订阅
	// 组件被初始化后this.list将被注入当前 userAdmin.list 的状态
	list: 'userAdmin.list'
}, {// 代理action设置
	// 创建getDetails方法可调起模块的getUserDetails
	getDetails: 'userAdmin.getUserDetails'
})
export default class UserAdmin extends Component {
	constructor() {
		// 通过dispatch方式调起action
		this.dispatch('userAdmin.fetchList');
	}
	async showUserDetails(id) {
		// 调用action代理方法，并获得action执行结果
		const details = await this.getDetails(id).details;
		// 也可以通过dispatch调起action
		// const details = await this.dispatch('userAdmin.getUserDetails', id).details;
	}
    render() {
		// 以prop的方式注入到当前组件
		const { list } = this.props;
		return (
			<ul>
				{list.map(item => (<li key="item.id">
					...
					<button onClick={this.showUserDetails.bind(this, item.id)}>查看用户信息</button> 
				</li>))}
			</ul>
			...
		)
	}
}

````

#### 微信小程序
````javascript
import {Page} from 'tunk-wechat'
Page({
	// 状态订阅配置，Page隐藏状态下不会被注入状态
	// onShow时会重新注入已订阅的且已变更的状态
    state: {
		// list 是模块userAdmin定义的状态字段，可以被视图组件订阅
		// 组件被初始化后this.list将被注入当前 userAdmin.list 的状态
        list: 'userAdmin.list'
	},
	// 代理action设置
	actions:{
		// 创建getDetails方法可调起模块的getUserDetails
        getDetails: 'userAdmin.getUserDetails'
	},
	// list有新状态准备注入前调用
	onBeforeStateChange(newState){
		// state订阅的状态数据，会被注入到this.data中
		const oldListState = this.data.list;
		// 返回结果可控制setData的内容
		// 若没有定义onBeforeStateChange或没有返回Object内容，则默认注入newState
    	return {list: newState.list.concat(oldListState)}
	},
	onLoad(){
		// 通过dispatch方式调起action
    	this.dispatch('userAdmin.fetchList');
	},
	
	showUserDetails(id){
		// 若action为同步函数，可直接获得结果，若为异步需在then方法中获得
		// 调用action代理方法，并获得action执行结果
		this.getDetails(id).then(data => {
			const details = data.details;
			...
		});
		// 也可以通过dispatch调起action
		// this.dispatch('userAdmin.getUserDetails', id).then(...);
		
	}
}
````

#### 视图组件与tunk数据服务层通信

##### A. 两种方式触发模块的Action

1. 通过在设置action属性（vue/微信小程序）或connect（react）设置action注入配置，向视图组件注入Action代理方法，向视图组件注入Action代理方法
2. 使用 `this.dispatch('moduleName.actionName', [arg1, arg2, ...])`，支持异步

##### B. 两种方式获得Action处理结果

1. **被动注入**：通过设置属性`state`，可订阅不同模块的状态
2. **主动获取**：`dispatch`方法调起action，支持返回action执行结果，支持异步

### tunk状态流

<div style="text-align:center; margin-bottom:50px;">
<img src="https://github.com/tunkjs/gitbook-tunkjs/blob/master/img/tunk-flow.png?raw=true" alt="tunk logo">
</div>


### 通信 


#### 视图组件与模块间通信

模块间通信和模块与组件间通信是完全解耦的，所有模块共同构成一个数据服务层，视图组件面向这个数据服务层进行通信。

**视图组件调起action的两种方式：**

1. 视图组件通常会被提供一个类似dispatch方法，这个方法仅支持调起action，如：`this.dispatch('moduleName.actionName', arg1, arg2, ...);`
2. 跟视图框架绑定的组件通常会支持`actons`组件属性，用来自动生成该组件可直接调用的action代理方法

**视图组件获得数据的两个途径：**

1. **被动注入** ：订阅不同模块的状态字段，当action引起了状态变更，订阅的组件会被注入新状态
2. **主动获取** ：视图组件通常会被提供一个类似dispatch方法，这个方法仅支持调返回action返回的结果

不同视图框架绑定组件的实现大同小异，具体可查看相关实例

* [tunk-react](https://github.com/tunkjs/gitbook-tunkjs/blob/master/doc/plugins/tunk-react.md)
* [tunk-vue](https://github.com/tunkjs/gitbook-tunkjs/blob/master/doc/plugins/tunk-vue.md)
* [tunk-wechat](https://github.com/tunkjs/gitbook-tunkjs/blob/master/doc/plugins/tunk-wechat.md)



### 要点


1. 对任何状态管理器来说，如果数据不会被复用或者数据量过大，不推荐你将这部分数据定义为状态来维护，状态快照的生成需要做到引用隔离，而引用隔离摆脱不了深克隆的性能损耗。

2. “主动获取”的方式不会生成状态快照，因此效率较高，可以理解这部分数据为“临时状态”，一般用完即焚，可视为传统状态流的补充。

3. 我们推荐你尽可能的把数据处理逻辑从视图层剥离开来，除了分离关注带来的好处外，假设你开发完wap版本的应用，又准备开发嵌入到原生app的RN版本或者微信小程序版本，只要包装好数据源，数据服务层是可以直接复用的。


----

[tunk](https://github.com/tunkjs/gitbook-tunkjs)




