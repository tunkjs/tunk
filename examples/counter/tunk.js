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
			async: false,
			debug: false,
			cache:false
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

	tunk.Watch = decorateWatcher;
	tunk.Action = decorateAction;
	tunk.createModule = createModule;

	hooks.initModule=function(module, opts){ return new module(); };
	function createModule(module, opts) {

		var name = module.name;

		if(!name) throw 'the name of module was required.';
		if(modules[name]) throw 'the module '+name+' already exists';

		module = constructModule(module, opts);

		modules[name] = hooks.initModule(module, opts);

		var defaultState = modules[name].state;

		if(typeof defaultState !=='undefined' && typeof defaultState !=='object'){
			if(configs.debug){
				console.error('object type of the default state is required',{name:name, defaultState:defaultState});
			} else throw 'object type of the default state is required';
		}else if(typeof defaultState ==='undefined') store[name] = {};

		return modules[name];

	};

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
		target.actionOptions = Object.assign({},opts);
		return target;
	}

	hooks.callAction = function(dispatch, originAction, args, module){
		var result = apply(originAction, args, module);
		if (typeof result !== 'undefined') dispatch.call(module, result);
	}
	function createAction(moduleName, actionName, originAction){

		action.actionOptions = originAction.actionOptions;

		return action;

		function action() {

			//数据&动作 建立关联
			this.dispatch = dispatch;
			if (configs.async) {
				var args = arguments;
				setTimeout(function () {
					hooks.callAction(dispatch, originAction, args, modules[moduleName]);
				}, 0);
			} else {
				hooks.callAction(dispatch, originAction, arguments, this);
			}
		}

		function dispatch() {
			return run_middlewares(this, arguments, {
				moduleName: moduleName,
				actionName: actionName,
				modules: modules,
				store: store,
			}, dispatch);
		}
	};

	hooks.callWatcher = function(dispatch, watcher, newValue, watchingStatePath, watchingModule, action, module){
		var result = watcher.call(module, newValue, watchingStatePath, watchingModule, action);
		if (typeof result !== 'undefined') dispatch.call(module, result);
	}
	function createWatcher(moduleName, watcherName, watcher){

		var watchPath = watcher.watcherOptions.watchPath;

		if(moduleName===watchPath[0]) throw 'you can\'t watch the state of current module';

		watchers[watchPath[0]] = watchers[watchPath[0]] || {};
		watchers[watchPath[0]][watchPath[1]] = watchers[watchPath[0]][watchPath[1]] || [];

		watchers[watchPath[0]][watchPath[1]].push(function(newValue, watchingStatePath, watchingModule, action){
			if(!modules[watchPath[0]])
				throw 'unknown module name ' + watchPath[0];

			//数据&动作 建立关联
			modules[moduleName].dispatch = dispatch;

			if (configs.async) {
				setTimeout(function () {
					hooks.callWatcher(dispatch, watcher, newValue, watchingStatePath, watchingModule, action, modules[moduleName]);
				})
			}else{
				hooks.callWatcher(dispatch, watcher, newValue, watchingStatePath, watchingModule, action, modules[moduleName]);
			}
		});

		return banCallingWatcher;

		function dispatch() {
			return run_middlewares(this, arguments, {
				moduleName: moduleName,
				actionName: watcherName,
				modules: modules,
				store: store,
			}, dispatch);
		}
	};

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
				if (!otherModuleName) return clone(store[name], modules[name]._isolate_);
				else return clone(store[otherModuleName], modules[otherModuleName]._isolate_);
			}
		});

		protos.dispatch=dispatch;

		protos._isolate_ = opts.isolate;

		function dispatch() {
			return run_middlewares(this, arguments, {
				moduleName: name,
				actionName: 'NONEACTION', //只有构造时可能会调用到此dispatch，无动作关联
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
							if(configs.debug){
								console.error('object type of the default state is required',{name:name, defaultState:defaultState});
							} else throw 'object type of the default state is required';
						}
						store[name] = Object.assign({}, clone(state, protos._isolate_));
					} else throw 'you could just initialize state by setting an object to state, please use dispatch instead.';
				}
			}
		});

		return module;
	};



	hooks.checkReadyToStore=function(moduleName, actionName, state, changedState){return true;};
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
			index = middlewares.length;
			if(hooks.checkReadyToStore(context.moduleName, context.actionName, store[context.moduleName], result))
				return storeNewState(result, context.moduleName, context.actionName);
		}
	}


	hooks.store=function(moduleName, actionName, state, changedState){ Object.assign(state, changedState); };
	hooks.updateComponentState = function(comp, propName, newValue, moduleName, actionName){}
	function storeNewState(obj, moduleName, actionName) {
		var newValue,
			pipes = connections[moduleName],
			changedFields = Object.keys(obj),
			changedState = clone(obj, modules[moduleName]._isolate_),
			values = {},
			statePath,
			watchers_;

		if(configs.debug){
			console.groupCollapsed('storeState', moduleName, actionName);
			console.log('action', moduleName+'.'+actionName);
			console.log('changedState',changedState);
			console.log('store['+moduleName+']', clone(store[moduleName], 'deep'));
			console.groupEnd();
		}

		hooks.store(moduleName, actionName, store[moduleName], changedState);

		if (pipes && pipes.length) for (var i = 0, l = pipes.length; i < l; i++) if (pipes[i]) {

			statePath = pipes[i].statePath;

			// 只更新 changedFields 字段
			if (statePath[1] && changedFields.indexOf(statePath[1]) === -1) continue;

			//减少克隆次数，分发出去的数据用同一个副本，减少调用 pathValue
			newValue = values[statePath] || (values[statePath] = pathValue(statePath));

			hooks.updateComponentState(pipes[i].comp, pipes[i].propName, newValue, moduleName, actionName);

			if(watchers[statePath[0]] && (watchers_=watchers[statePath[0]][statePath[1]])){
				for(var ii=0,ll=watchers_.length;ii<ll;ii++) {
					watchers_[ii](newValue, statePath, moduleName, actionName);
				}
			}
		}
		return changedState;
	}




	tunk.dispatch = function (moduleName, options) {
		if (moduleName && moduleName.constructor === String)
			storeNewState (options, moduleName, 'NONEACTION');
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


	tunk.connection = {
		state: function (targetObject, propName, statePath) {

			if(!statePath[0] || !modules[statePath[0]]) throw 'unknown module name:'+statePath[0];
			connections[statePath[0]] = connections[statePath[0]] || [];
			connections[statePath[0]].push({
				comp: targetObject,
				propName: propName,
				statePath: statePath,
			});

			//返回组件默认数据
			return pathValue(statePath);

		},
		action: function (target, propName, moduleName, actionName) {
			if (!modules[moduleName]) throw 'unknown module name ' + moduleName;
			if (!modules[moduleName][actionName]) throw 'unknown action name ' + action[1] + ' of ' + moduleName;
			if(!modules[moduleName][actionName].actionOptions ) throw 'the method '+action[1]+' of '+moduleName+' is not an action';
			target[propName] = function () {
				apply(modules[moduleName][actionName], arguments, modules[moduleName]);
			};
		},

		dispatch: function (moduleName, actionName, argsArray) {
			if (!modules[moduleName]) throw 'unknown module name ' + moduleName + '.';
			if (!modules[moduleName][actionName]) throw 'unknown action name ' + actionName + ' of ' + moduleName + '';
			if(!modules[moduleName][actionName].actionOptions) throw 'the method '+actionName+' of '+moduleName+' is not an action';
			apply(modules[moduleName][actionName], argsArray, modules[moduleName]);
		},

		clearState: function (target, propName, statePath) {
			var tmp = [];
			for (var i = 0, l = connections[statePath[0]].length; i < l; i++) {
				if (connections[statePath[0]][i].comp !== target) tmp.push(connections[statePath[0]][i]);
			}
			connections[statePath[0]] = tmp;

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
	function pathValue(statePath) {
		var isolate = modules[statePath[0]]._isolate_;
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

