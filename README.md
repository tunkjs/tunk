## Intro
Tunk是一个APP开发的状态管理模式，可以与任何界面框架配合实现状态驱动界面更新。
它采用集中式存储、分散式管理的方式去维护应用的状态，以状态管理模块中的动作定义来更新所属模块的状态来控制可预知的应用状态变化。
* **轻量**  -  tunk核心代码仅600多行，与之配套的tunk-vue、tunk-react也不过一两百行
* **简洁**  –  不同模块分散关注不同的业务数据的管理，模块责任划分简单、明确，以类的方式编写管理模块并支持继承，更便于逻辑抽象及代码复用
* **高效**  –  相对于给开发者增加多一块代码来实现 “控制可预知的状态更新” 的vuex和redux，tunk的实现方式具有更好的编程体验

使用tunk以类的模式组织代码维护应用状态，以订阅的模式绑定UI实时反映状态变更，简化了数据逻辑与UI逻辑的关联，提供更好的编程体验。

tunk的职责仅仅为动作驱动状态变更的简洁实现，本身并不包含更多的其他逻辑，与特定视图框架配合（如：vue/react）需要绑定到特定视图框架的插件。

例如： [tunk-vue](https://github.com/tunkjs/tunk-vue)  [tunk-react](https://github.com/tunkjs/tunk-react) 

tunk不限制使用数据请求插件，但我们也提供了支持Promise的 [tunk-request](https://github.com/tunkjs/tunk-request) 插件，该插件会自动生成相应全局请求状态的模块，[戳这里了解更多](https://github.com/tunkjs/tunk-request)


## Wiki

[Document](https://github.com/tunkjs/tunk/wiki/Tunk%E5%BF%AB%E9%80%9F%E5%85%A5%E9%97%A8)











