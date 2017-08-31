# Tunk

Tunk是一个WebAPP状态管理模式，可以与任何视图框架配合实现状态驱动界面更新。

* 采用集中式存储、分散式管理的方式来维护应用的状态，配合数据隔离模式以动作来更新所属模块的状态来控制不可预知的应用状态变化，有效提高开发效率、降低维护成本
* 不同模块分散关注不同的业务数据的管理，模块责任划分简易、明确，以类的方式编写管理模块并支持继承，更便于逻辑抽象及代码复用
* 依靠动作执行来维护应用状态，以订阅的模式绑定UI实时反映状态变更，简化了数据逻辑与UI逻辑的关联，提高开发效率和编程体验
* 开放式编码提供丰富钩子以便于组件开发的切入，tunk核心代码体积小，相关组件整体体积也偏小

tunk的职责仅仅为动作驱动状态变更的简洁实现，本身并不包含更多的其他逻辑，与特定视图框架配合（如：vue/react）需要绑定到特定视图框架的组件

如： tunk-vue tunk-react


## Wiki

[tunk快速入门](https://github.com/tunkjs/tunk/wiki/Tunk%E5%BF%AB%E9%80%9F%E5%85%A5%E9%97%A8)

[tunk-vue](https://github.com/tunkjs/tunk-vue)  

[tunk-react](https://github.com/tunkjs/tunk-react) 

[tunk-request](https://github.com/tunkjs/tunk-request)

[tunk-loader](https://github.com/tunkjs/tunk-loader)







