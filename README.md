
<div style="text-align:center; margin-bottom:50px;">
<img style="width: 200px;" src="https://github.com/tunkjs/gitbook-tunkjs/blob/master/img/logo1x.png?raw=true" alt="tunk logo">
</div>


#### tunkjs是一个具有状态管理功能的前端数据服务框架，提供了一个让数据处理逻辑与交互逻辑完美解耦与灵活通信的模式。 

### 开发初衷

状态管理在项目应用中，经常会碰到一些不适用状态管理的场景，在单纯处理状态管理的骨架里并不能灵活处理这些场景。另外，项目经过长时间的迭代，越发觉得常规的状态流方案存在着一些不必要的编码环节，一定程度上提高了开发维护成本。

**tunkjs** 应运而生！

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

### 一个模块

````javascript
// 场景：在用户管理列表中弹框查看用户详细信息
import {create, action} from 'tunk'
@create
class userAdmin {
	constructor(){
		// 仅定义list为状态字段
		this.state = {
			list:[]
		}
	}
	// 请求用户列表
	@action
	fetchList(param){
		const res = this.request(...);
		return {list: res.list};
	}
	// 下面的方法用于请求用户详细信息
	// details用完即焚，不必作为状态去维护，因此未定义为状态字段
	@action
	async getUserDetails(id){
		const res = await this.request(...);
		return {details: res.data};
	}
	someFunc(){
		this.getState()
	}
	...
}
````

你只需要面向数据逻辑对象来设计一个模块类，如有需要，你也可以尝试继承一个父类。

````javascript
@create
class userAdmin extends Base{
	constructor(){
		super();
		this.state = {};
	}
}
````

`@create`将会对模块类进行重构、实例化以及存储该模块的实例化对象，实例化后，tunk内置store对象会生成字段名为'userAdmin'的由该模块负责维护的状态树节点对象

构造器内给state属性赋值，将决定对应状态树节点对象的字段和初始值。

````javascript
constructor(){
   //初始化后state属性只读，二次赋值将报错，读取的数据来自状态树的状态快照
	this.state = {
		list:[]
	}
}
````

`@action`定义一个方法为一个action，可以是异步方法

````javascript
@action
async fetchList(param){
	const res = await this.request(...);
	...
}
````

action内可通过return返回结果或dispatch传入一个Object，让数据开始流入tunk，经过中间件的处理，最终流入到store状态树

````javascript
@action
async fetchList(param){
	const res = await this.request(...);
	// return的内容会经过中间件的处理，最后更新到状态树
	// this.dispatch({list: res.list}) 跟return返回的结果进入的处理流程一样
	return {list: res.list};
}
````

action只能更新当前模块对应的状态树节点的状态，而且只能更新对应节点已存在的字段的状态，无法创建新状态字段

````javascript
@action
async fetchList(param){
	const res = await this.request(...);
	// 由于在构造器给state属性定义过list字段，
	// 下面return的内容只有list的新状态更新到状态树
	return {list: res.list, otherData: res.otherData};
}
````

上面的例子中，otherData的数据不会更新到状态树，但可以通过调起这个action时获得该数据，如：

````javascript
async otherFunction(){
	// 同一模块下的action
	const res = await this.fetchList(...);
	// 可通过内置dispatch方法调起其他模块的action，并获得action返回的结果
	const res2 = await this.dispatch('moduleName.actionName');
}
````

return 与 dispath后续的处理是一样的，区别是，return只能传递一个参数，dispatch不限


### tunk状态流

<div style="text-align:center; margin-bottom:50px;">
<img src="https://github.com/tunkjs/gitbook-tunkjs/blob/master/img/tunk-flow.png?raw=true" alt="tunk logo">
</div>


### 通信 

#### 模块间通信 

1. 通过`this.dispatch('moduleName.actionName');`调起其他模块的action及获取action处理结果
2. 内置getState方法

````javascript
this.getState(); // 等同于 this.state，获得当前模块的状态
//假设模块myModule的状态节点对象为{key0:{key1:[{key2:1}]}}
// 获得其他模块的状态
this.getState('myModule.key0.key1.0.key2'); // 1
````

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

### 文档与实例

[tunk](https://github.com/tunkjs/gitbook-tunkjs)

[examples](https://github.com/tunkjs/examples)




