## Intro
Tunk是一个APP开发的状态管理模式，可以与任何界面框架配合实现状态驱动界面更新。
它采用集中式存储、分散式管理的方式去维护应用的状态，以状态管理模块中的动作定义来更新所属模块的状态来控制可预知的应用状态变化。
* **轻量**  -  tunk核心代码仅600多行，与之配套的tunk-vue、tunk-react也不过一两百行
* **简洁**  –  不同模块分散关注不同的业务数据的管理，模块责任划分简单、明确，以类的方式编写管理模块并支持继承，更便于逻辑抽象及代码复用
* **高效**  –  相对于给开发者增加多一块代码来实现 “控制可预知的状态更新” 的vuex和redux，tunk的实现方式具有更好的编程体验，模块的编写

使用tunk以类的模式组织代码维护应用状态，以订阅的模式绑定UI实时反映状态变更，简化了数据逻辑与UI逻辑的关联，提供更好的编程体验。

tunk的职责仅仅为动作驱动状态变更的简洁实现，本身并不包含更多的其他逻辑，与特定视图框架配合（如：vue/react）需要绑定到特定视图框架的插件。

例如： [tunk-vue](https://github.com/tunkjs/tunk-vue)  [tunk-react](https://github.com/tunkjs/tunk-react) 

tunk不限制使用数据请求插件，但我们也提供了支持Promise的 [tunk-request](https://github.com/tunkjs/tunk-request) 插件，该插件会自动生成相应全局请求状态的模块，[戳这里了解更多](https://github.com/tunkjs/tunk-request)


## Wiki

[Document](https://github.com/tunkjs/tunk/wiki/Tunk%E5%BF%AB%E9%80%9F%E5%85%A5%E9%97%A8)





## Usage
````shell
# tunk核心模块
npm install -S tunk
# 使用 VUE 配合开发
npm install -S tunk-vue
# 使用 REACT 配合开发
npm install -S tunk-react
````

## Examples

#### index.js
````javascript
//完成vue、tunk、tunk-vue的引入及绑定
import Vue from 'vue';
import tunk from "tunk";
import tunkVue from "tunk-vue";
Vue.use(tunkVue(tunk));
// 引入状态管理模块即可完成状态管理模块的初始化
import './helloTunk';
 ````
 
 #### helloTunk.js
 ````javascript
 
//编写一个状态管理模块   helloTunk.js  （状态管理模块实际不存储状态数据，仅起管理作用）
import {create, action} from 'tunk';

// 类名通常会被压缩因此需要给create修饰器传入模块名，可使用tunk-loader避免传入类名的繁琐
@create('helloTunk') 
class helloTunk {
    constructor(){ 
        //定义状态内容，将确定统一存储于状态树中的初始数据
        this.state = { 
            text: ''
        };
    }

    // 使用action修饰器定义changeText为状态更新的动作，所有动作仅能更新所属模块的状态
    @action 
    changeText(n){
        // 通过返回一个数据对象来更新当前模块负责维护的状态，
        // 返回的内容通过可配置的隔离模式去更新状态树
        return { text: this.getAllText()[n % 4]};  
    }
    getAllText(){
       return {
            0: 'hello world',
            1: 'i am supper man',
            2: 'just do IT',
            3: 'i love you'
        }
    }
}
````

#### HelloVue.vue
````vue
//编写vue组件   HelloVue.vue
<template>
    <button @click=“say(Date.now() % 4)”> saySomething </button>
    <button @click=“saySomething()”> say IOU </button>
    <section> {{text}}  </section>
</template>
<script>
export default {
    // 绑定helloTunk模块中的text状态，后续可了解更多高效的绑定方式
    state:{
        text: 'helloTunk.text'
    },  
    // 绑定helloTunk的动作
    action:{
        say: 'helloTunk.changeText'
    },  
    methods:{
        saySomething(){
            // 通过dispatch方法发起未绑定的动作执行
            this.dispatch('helloTunk.changeText', 3);    
       }
   }
}
</script>
````







