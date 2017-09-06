# Tunk

Tunk是一个高效的WebAPP状态管理器，可以与任何视图框架配合实现状态驱动界面更新。

tunk做到了采用集中式存储、分散式管理的方式来维护应用的状态、配合数据隔离模式、以模块的动作执行更新所属模块的状态来控制不可预知的应用状态变化，有效提高开发效率、降低编程犯错的概率，降低开发人员对业务开发的障碍感。

不同模块分散关注不同的业务数据的管理，模块责任划分简易、明确，以类的方式编写管理模块并支持继承，更便于逻辑抽象及代码复用。

依靠动作执行来维护应用状态，以订阅的模式绑定UI实时反映状态变更，简化了数据逻辑与UI逻辑的关联。

开放式编码提供丰富钩子以便于业务组件的切入，便于开发人员优化程序架构

在你的应用中使用tunk会有以下一些改进：
1. 简化架构、简化业务开发逻辑，降低程序设计的障碍感，提高开发效率
2. 数据处理与视图效果开发彻底分离，便于优化业务开发流程
3、一定程度上减少不可预知的编程意外，降低出BUG率
5、数据变更注入view组件效率高，性能上有一定程度上的改善


## Wiki

[Document](https://github.com/tunkjs/tunk/wiki/Tunk%E5%BF%AB%E9%80%9F%E5%85%A5%E9%97%A8)

## 相关资源
[tunk-vue](https://github.com/tunkjs/tunk-vue)  

[tunk-react](https://github.com/tunkjs/tunk-react) 

[tunk-request](https://github.com/tunkjs/tunk-request)

[tunk-loader](https://github.com/tunkjs/tunk-loader)







