### tunk(store:Store)
> 使用用户自定义或组件提供的Store实例置换tunk内置默认的store对象，通常在组件


### 配置继承机制
> 配置分三个层面 全局配置 > 模块级配置 > Action级配置，配置从上到下自动继承，层面约低优先级越高，相当于 
> 
> `Object.assign(globalConfig, moduleConfig, actionConfig)`
> 
> tunk.config就是设置全局配置的方式
> 
> @create(moduleConfig) 设置模块级别的配置
> 
> @action(actionConfig) action级别的配置