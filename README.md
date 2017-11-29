# Tunk

实现交互逻辑和数据处理逻辑优雅分离与结合的一个精简高效的应用状态管理框架。

## 简介：

tunk采用集中存储、分散管理的方式来维护应用状态。攻城狮需要面向业务数据逻辑对象来设计状态管理模块，并且仅能由所属模块定义的Action去更新所属模块定义的状态，而模块实际不存储状态数据，这样的机制有利于代码职责的划分及控制不可预知的状态变化。

tunk核心代码精简轻量，仅提供作为一个状态容器的抽象实现，同时我们提供了一些常用的搭配组件，攻城狮可针对不同项目规模选用tunk组件来搭建合适的架构，当然，也可以轻松开发切入到tunk核心的组件。

## Install

````javascript
npm install tunk -S
````

## Wiki

[Document](https://github.com/tunkjs/tunk/wiki/Tunk%E5%BF%AB%E9%80%9F%E5%85%A5%E9%97%A8)

## 相关资源

[tunk-vue](https://github.com/tunkjs/tunk-vue)  

[tunk-react](https://github.com/tunkjs/tunk-react) 

[tunk-request](https://github.com/tunkjs/tunk-request)

[tunk-loader](https://github.com/tunkjs/tunk-loader)
