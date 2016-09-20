(function() {

	var apply = require('apply.js');

	var store = {},
		modules = {},
		connections = [],
		mixins = {},
		middlewares = [],
		watchers = {},
		hooks={},
		configs={
			isolate: 'deep', // deep, shallow, none
			async: false
		};


	function tunk(conf) {
		Object.assign(configs, conf);
	}

	tunk.configs = configs;

	tunk.config = tunk;

	tunk.watch = function (watchPath, opts) {
		return function (target, property, descriptor) {
			decorateWatcher(target[property], watchPath, opts);
		}
	}

	tunk.action = function (opts, property) {
		if (typeof property === 'string' && opts[property]) {
			return decorateAction(opts[property], {});
		} else return function (target, property, descriptor) {
			return decorateAction(target[property], opts);
		}
	}

	tunk.create = function (opts) {
		if (typeof opts === 'function') {
			return createModule(opts, {});
		} else return function (target, property, descriptor) {
			return createModule(target, opts);
		};
	}

	tunk.createWatch = decorateWatcher;
	tunk.createAction = decorateAction;
	tunk.createModule = createModule;

	hooks.initModule=function(module, store, moduleName, opts){ return new module(); };
	function createModule(module, opts) {

		var name = module.name;

		if(!name) throw 'the name of module was required.';
		if(modules[name]) throw 'the module '+name+' already exists';

		opts = Object.assign({}, configs, opts);

		module = constructModule(module, opts);

		modules[name] = hooks.initModule(module, store, name, opts);

		var defaultState = modules[name].state;

		if(typeof defaultState !=='undefined' && typeof defaultState !=='object'){
			throw 'object type of the default state is required';
		}else if(typeof defaultState ==='undefined') store[name] = {};

		return modules[name];

	}

	function decorateWatcher(target, watchPath, opts){
		if(typeof watchPath !=='string' || (watchPath=watchPath.split('.')).length !== 2 )
			throw 'the path you watch should be like moduleName.stateName';
		if(target.actionOptions) throw 'you can not set a action method to be a watcher';
		opts = Object.assign({watchPath:watchPath},opts);
		target.watcherOptions = opts;
		return target;
	}

	function decorateAction(target, opts){
		if(target.watcherOptions) throw 'you can not set a watcher method to be an action';
		target.actionOptions = Object.assign({}, opts);
		return target;
	}

	hooks.callAction = function(dispatch, originAction, args, module, moduleName, actionName,  actionOptions){
		var result = apply(originAction, args, module);
		if (typeof result !== 'undefined') dispatch.call(module, result);
	}
	function createAction(moduleName, actionName, originAction){

		action.actionOptions = originAction.actionOptions;

		return action;

		function action() {

			if(!action.actionOptions.__composed__){
				action.actionOptions = Object.assign({__composed__:true}, this.moduleOptions, originAction.actionOptions);
			}

			var actionOptions = action.actionOptions;

			//数据&动作 建立关联
			this.dispatch = dispatch;

			if (configs.async) {
				var args = arguments;
				setTimeout(function () {
					hooks.callAction(dispatch, originAction, args, modules[moduleName], moduleName, actionName, actionOptions);
				}, 0);
			} else {
				hooks.callAction(dispatch, originAction, arguments, this, moduleName, actionName, actionOptions);
			}

			function dispatch() {
				return run_middlewares(this, arguments, {
					moduleName: moduleName,
					actionName: actionName,
					options:actionOptions,
					modules: modules,
					store: store,
				}, dispatch);
			}
		}
	}

	hooks.callWatcher = function(dispatch, watcher, newValue, watchingStatePath, watchingModule, fromAction, module, moduleName, watcherName, watcherOptions){
		watcher.call(module, newValue, watchingStatePath, watchingModule, fromAction);
	}
	function createWatcher(moduleName, watcherName, watcher){

		var watchPath = watcher.watcherOptions.watchPath;

		if(moduleName===watchPath[0]) throw 'you can\'t watch the state of current module';

		watchers[watchPath[0]] = watchers[watchPath[0]] || {};
		watchers[watchPath[0]][watchPath[1]] = watchers[watchPath[0]][watchPath[1]] || [];

		watchers[watchPath[0]][watchPath[1]].push(function(newValue, watchingStatePath, watchingModule, fromAction){
			if(!modules[watchPath[0]])
				throw 'unknown module name ' + watchPath[0];

			if(!watcher.watcherOptions.__composed__)
				watcher.watcherOptions = Object.assign({__composed__:true}, modules[moduleName].moduleOptions, watcher.watcherOptions);

			var watcherOptions = watcher.watcherOptions;

			//数据&动作 建立关联
			modules[moduleName].dispatch = dispatch;

			if (configs.async) {
				setTimeout(function () {
					hooks.callWatcher(dispatch, watcher, newValue, watchingStatePath, watchingModule, fromAction, modules[moduleName], moduleName, watcherName, watcherOptions);
				})
			}else{
				hooks.callWatcher(dispatch, watcher, newValue, watchingStatePath, watchingModule, fromAction, modules[moduleName], moduleName, watcherName, watcherOptions);
			}

			function dispatch() {
				return run_middlewares(this, arguments, {
					moduleName: moduleName,
					actionName: watcherName,
					options:watcherOptions,
					modules: modules,
					store: store,
					isWatcher:true,
					watchPath:watchingStatePath,
				}, dispatch);
			}
		});

		return banCallingWatcher;


	}

	function banCallingWatcher(){throw 'you can\'t call watcher directly'}

	hooks.override =function(moduleName, protos, protoName){
		if (protos[protoName].actionOptions){
			return createAction(moduleName, protoName, protos[protoName]);
		}else if(protos[protoName].watcherOptions) {
			return createWatcher(moduleName, protoName, protos[protoName]);
		}else return protos[protoName];
	}
	function constructModule(module, opts){
		var name = module.name;
		var protos = module.prototype;

		var properties = Object.getOwnPropertyNames(protos);

		for (var i = 0, l = properties.length; i < l; i++) if (protos[properties[i]]) {
			protos[properties[i]] = hooks.override(name, protos, properties[i]);
		}

		Object.assign(protos, mixins, {
			getState: function getState(otherModuleName) {
				if (!otherModuleName) return clone(store[name], opts.isolate);
				else return clone(store[otherModuleName], modules[otherModuleName].moduleOptions.isolate);
			}
		});

		protos.dispatch=dispatch;

		protos.moduleOptions = opts;

		function dispatch() {
			return run_middlewares(this, arguments, {
				moduleName: name,
				actionName: 'NONEACTION', //只有构造时可能会调用到此dispatch，无动作关联
				options:opts,
				modules: modules,
				store: store,
			}, dispatch);
		}

		Object.defineProperties(protos, {
			'state': {
				get: function () {
					return this.getState();
				},
				set: function (state) {
					if(!store[name]) {
						if(typeof defaultState !=='undefined' && typeof defaultState !=='object'){
							throw 'object type of the default state is required';
						}
						store[name] = Object.assign({}, clone(state, opts.isolate));
					} else throw 'you could just initialize state by setting an object to state, please use dispatch instead.';
				}
			}
		});

		return module;
	}


	hooks.store=function(moduleName, actionName, state, changedState, options){ Object.assign(state, changedState); };
	hooks.updateComponentState = function(comp, propName, newValue, moduleName, actionName, options){};
	hooks.storeNewState = function(obj, moduleName, actionName, options) {
		var newValue,
			pipes = connections[moduleName],
			changedFields = Object.keys(obj),
			changedState = clone(obj, options.isolate),
			values = {},
			statePath,
			watchers_;

		hooks.store(moduleName, actionName, store[moduleName], changedState, options);

		if (pipes && pipes.length) for (var i = 0, l = pipes.length; i < l; i++) if (pipes[i]) {

			statePath = pipes[i].statePath;

			// 只更新 changedFields 字段
			if (statePath[1] && changedFields.indexOf(statePath[1]) === -1) continue;

			//减少克隆次数，分发出去的数据用同一个副本，减少调用 pathValue
			newValue = values[statePath] || (values[statePath] = pathValue(statePath, options));

			hooks.updateComponentState(pipes[i].comp, pipes[i].propName, newValue, moduleName, actionName, options);

			if(watchers[statePath[0]] && (watchers_=watchers[statePath[0]][statePath[1]])){
				for(var ii=0,ll=watchers_.length;ii<ll;ii++) {
					watchers_[ii](newValue, statePath, moduleName, actionName);
				}
			}
		}
		return changedState;
	};


	function run_middlewares(module, args, context, dispatch) {
		var index = 0;

		return next(args);

		function next(args) {
			if (typeof args !== 'object' || isNaN(args.length)) throw 'the param of next should be type of array or arguments';
			if (index < middlewares.length)
				return apply(middlewares[index++](dispatch, next, end, context), args, module);
			else return end(args[0]);
		}

		function end(result) {
			if (!result) return;
			if (result.constructor !== Object) {
				console.log(arguments);
				throw 'the param of end should be a plain data object';
			}
			if(context.isWatcher) throw 'A watcher could not update store directly';
			index = middlewares.length;
			hooks.storeNewState(result, context.moduleName, context.actionName, context.options);
		}
	}







	tunk.dispatch = function (moduleName, options) {
		if (moduleName && moduleName.constructor === String)
			storeNewState (options, moduleName, 'NONEACTION', configs);
		else throw 'the first argument should be a module name and the second shuould be a plain object';
	};

	// tunk.hook(hookName, function(origin){
	// 		return function(...args){

	//			return origin.call(null, args);

	// 		}
	// });
	//Aspect Programming
	tunk.hook = function(hookName, func){

		var originHook = hooks[hookName];

		if(!originHook) throw 'hook '+hookName+' is not exist';

		if (typeof func !== 'function') throw 'the second argument should be a function';

		func = func(originHook);

		if (typeof func !== 'function') throw 'the function should return a hook function';

		hooks[hookName] = func;
	}

	tunk.addMiddleware = function (middleware) {
		if (typeof middleware === 'object' && middleware.constructor === Array)
			middlewares = middlewares.concat(middleware);
		else if (typeof middleware === 'function') middlewares.push(middleware);
	};

	tunk.mixin = function (obj) {
		Object.assign(mixins, obj);
	};


	hooks.connectState=function(targetObject, propName, statePath, value){
		connections[statePath[0]] = connections[statePath[0]] || [];
		connections[statePath[0]].push({
			comp: targetObject,
			propName: propName,
			statePath: statePath,
		});
	}
	hooks.connectAction=function(target, propName, moduleName, actionName){
		target[propName] = function () {
			apply(modules[moduleName][actionName], arguments, modules[moduleName]);
		};
	}
	hooks.connectDispatch=function(target, name, handle){
		target[name] = handle(function dispatch(moduleName, actionName, argsArray) {
			if (!modules[moduleName]) throw 'unknown module name ' + moduleName + '.';
			if (!modules[moduleName][actionName]) throw 'unknown action name ' + actionName + ' of ' + moduleName + '';
			if(!modules[moduleName][actionName].actionOptions) throw 'the method '+actionName+' of '+moduleName+' is not an action';
			apply(modules[moduleName][actionName], argsArray, modules[moduleName]);
		});
	}
	hooks.connectClean=function(target, stateOption){
		var tmp = [];
		for(var x in stateOption){
			for (var i = 0, l = connections[stateOption[x][0]].length; i < l; i++) {
				if (connections[stateOption[x][0]][i].comp !== target) tmp.push(connections[stateOption[x][0]][i]);
			}
			connections[stateOption[x][0]] = tmp;
		}
	}
	tunk.connection = {
		state: function (targetObject, propName, statePath) {

			if(!statePath[0] || !modules[statePath[0]]) throw 'unknown module name:'+statePath[0];

			var value = pathValue(statePath, modules[statePath[0]].moduleOptions);

			hooks.connectState(targetObject, propName, statePath, value);

			targetObject._stateOptions_ = targetObject._stateOptions_ || {};
			targetObject._stateOptions_[propName] = statePath;
			//返回组件默认数据
			return value;

		},
		action: function (target, propName, moduleName, actionName) {
			if (!modules[moduleName]) throw 'unknown module name ' + moduleName;
			if (!modules[moduleName][actionName]) throw 'unknown action name ' + action[1] + ' of ' + moduleName;
			if(!modules[moduleName][actionName].actionOptions ) throw 'the method '+action[1]+' of '+moduleName+' is not an action';
			hooks.connectAction(target, propName, moduleName, actionName);

		},

		dispatch: function(target, name, handle){
			hooks.connectDispatch(target, name, handle);
		},

		clean: function (target) {
			if(target._stateOptions_)
				hooks.connectClean(target, target._stateOptions_);
		},
	};


	tunk.mixin({

		each: function (obj, cb) {
			if (typeof obj === 'object') {
				if (typeof obj.length !== 'undefined') {
					for (var i = 0, l = obj.length; i < l; i++)
						if (cb(obj[i], i) === false) break;
				} else for (var x in obj)
					if (obj.hasOwnProperty(x) && cb(obj[x], x) === false) break;
			} else console.error('argument is wrong');
		},

		map: function (obj, cb) {
			var tmp, result = [];
			this.each(obj, function (value, key) {
				tmp = cb(value, key);
				if (typeof tmp !== 'undefined') result.push(tmp);
			});
			return result;
		},

		find: function (obj, cb) {
			var result;
			this.each(obj, function (value, key) {
				if (cb(value, key)) {
					result = value;
					return false;
				}
			});
			return result;
		},

		//默认为深克隆
		clone: function(obj, mode){
			return clone(obj, mode||'deep');
		},

	});





	//提升效率空间：支持两层 && 不克隆
	//支持5层
	function pathValue(statePath, options) {
		var isolate = options.isolate;
		var state = store[statePath[0]];
		if (!statePath[1]) return clone(state, isolate);
		else {
			state = isNaN(statePath[1]) ? state[statePath[1]] : (state[statePath[1]] || state[parseInt(statePath[1])]);
			if (!statePath[2] || typeof state !== 'object') return clone(state, isolate);
			else {
				state = isNaN(statePath[2]) ? state[statePath[2]] : (state[statePath[2]] || state[parseInt(statePath[2])]);
				if (!statePath[3] || typeof state !== 'object') return clone(state, isolate);
				else {
					state = isNaN(statePath[3]) ? state[statePath[3]] : (state[statePath[3]] || state[parseInt(statePath[3])]);
					if (!statePath[4] || typeof state !== 'object') return clone(state, isolate);
					else {
						return clone(isNaN(statePath[4]) ? state[statePath[4]] : (state[statePath[4]] || state[parseInt(statePath[4])]), isolate);
					}
				}
			}
		}
	}

	function clone(obj, mode) {

		if(typeof mode === 'undefined'){
			mode = configs.isolate;
		}

		if (typeof obj === 'object'){
			switch (mode){
				case 'deep':
					return JSON.parse(JSON.stringify(obj));
				case 'none':
					return obj;
				case 'shallow':
				default :
					return obj.constructor === Array ? obj.slice() : Object.assign({}, obj);
			}
		}else return obj;
	}


	if (typeof module === 'object' && module.exports) {
		module.exports = tunk;
	}
	else if (typeof define === 'function' && define.amd) {
		define(function () {
			return tunk;
		})
	}

})();

