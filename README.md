
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
除了tunk一般你还需要安装**视图框架绑定组件**

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

----

### 文档与实例

[tunk doc](https://github.com/tunkjs/gitbook-tunkjs)

[examples](https://github.com/tunkjs/examples)




