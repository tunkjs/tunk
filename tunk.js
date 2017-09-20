
(function () {

	var apply = require('apply.js');

	var store = {},
		modules = {},
		connections = [],
		mixins = {},
		middlewares = [],
		watchers = {},
		configs = {
			isolate: 'deep', // deep, shallow, none
			debug: false
		};
	
	function tunk() {}

	tunk.config = function(conf){
		Object.assign(configs, conf);
		return tunk;
	}

	tunk.use = function(plugin){
		apply(plugin, [{
			configs, 
			store, 
			modules, 
			connect: connection,
			hook,
			addMiddleware,
			mixin
		}], tunk);
		return tunk;
	}

	tunk.watch = function (watchPath, opts) {
		return function (target, property, descriptor) {
			decorateWatcher(target[property], watchPath, opts);
		};
	}

	tunk.action = function (opts, property) {
		if (typeof property === 'string' && opts[property]) {
			return decorateAction(opts[property], {});
		} else return function (target, property, descriptor) {
			return decorateAction(target[property], opts);
		}
	}

	tunk.create = function () {
		var name, opts = {};

		if (typeof arguments[0] === 'function') {
			if (!arguments[0].__getName__) throw '[TUNKJS]:you should set a module name like "@create(\'ModuleName\')" or using webpack plugin tunk-loader.';
			createModule(arguments[0], { name: arguments[0].__getName__() });
		}

		if (arguments[0]) if (typeof arguments[0] === 'string') {
			name = arguments[0];
		} else if (typeof arguments[0] === 'object') {
			opts = arguments[0];
		}
		if (arguments[1]) if (typeof arguments[1] === 'string') {
			name = arguments[1];
		} else if (typeof arguments[1] === 'object') {
			opts = arguments[1];
		}

		return function (target, property, descriptor) {
			opts.name = name || opts.name || target.__getName__();
			if (!opts.name) throw '[TUNKJS]:you should set a module name like "@create(\'ModuleName\')" or using webpack plugin tunk-loader.';
			createModule(target, opts); 
		};
	}

	tunk.createWatch = decorateWatcher;
	tunk.createAction = decorateAction;
	tunk.createModule = function (name, module, opts) {
		if (typeof name !== 'string') throw '[TUNKJS]:the name of module is required when creating a module with tunk.createModule().';
		opts = opts || {};
		opts.name = name;
		createModule(module, opts);
	};

	tunk.dispatch = function (moduleName, options) {
		if (moduleName && moduleName.constructor === String) {
			if (moduleName.indexOf('.') === -1) {
				hooks.storeNewState(options, moduleName, configs);
			} else {
				moduleName = moduleName.split('.');
				return dispatchAction(moduleName[0], moduleName[1], Array.prototype.slice.call(arguments, 1));
			}
		} else {
			throw '[TUNKJS]:the first argument should be a module name and the second shuould be a plain object';
		}
	};

	var hooks = {
		initModule : function (module, store, moduleName, opts) { 
			return new module(); 
		},
		callWatcher : function (originWatcher, newValue, module, watcherOptions) {
			originWatcher.call(module, newValue);
		},
		callAction : function (originAction, args, module, actionOptions) {
			var result = apply(originAction, args, module);
			// 处理异步动作返回的promise
			if(typeof result === 'object' && result.then) {
				return result.then(function(data){
					return module.dispatch(data);
				});
			}
			if (typeof result !== 'undefined') return module.dispatch.call(module, result);
		},
		override : function (moduleName, protos, protoName) {
			if (protos[protoName].actionOptions) {
				return createAction(moduleName, protoName, protos[protoName]);
			} else if (protos[protoName].watcherOptions) {
				return createWatcher(moduleName, protoName, protos[protoName]);
			} else return protos[protoName];
		},
		store : function (state, changedState, options) {
			Object.assign(state, changedState);
		},
		updateComponentState : function (comp, propName, newValue, options) { },
		storeNewState : function (obj, moduleName, options) {
			var newValue,
				pipes = connections[moduleName],
				changedFields = Object.keys(obj),
				changedState = obj,
				values = {},
				statePath,
				watchers_;

			hooks.store(store[moduleName], changedState, options);

			if (watchers[moduleName]) for (var x in changedFields) if (watchers_ = watchers[moduleName][changedFields[x]]) {
				statePath = [moduleName, changedFields[x]];
				newValue = values[statePath] || (values[statePath] = hooks.getValueFromStore(statePath, options));
				for (var ii = 0, ll = watchers_.length; ii < ll; ii++) {
					watchers_[ii](newValue, statePath, moduleName);
				}
			}
			setTimeout(function () {
				if (pipes && pipes.length) for (var i = 0, l = pipes.length; i < l; i++) if (pipes[i]) {
					statePath = pipes[i].statePath;
					// 只更新 changedFields 字段
					if (statePath[1] && changedFields.indexOf(statePath[1]) === -1) continue;
					//减少克隆次数，分发出去到达 View 的数据用同一个副本，减少调用 hooks.getValueFromStore
					newValue = values[statePath] || (values[statePath] = hooks.getValueFromStore(statePath, options));
					hooks.updateComponentState(pipes[i].comp, pipes[i].propName, newValue, options);
				}
			});

			return changedState;
		},
		connectState : function (targetObject, propName, statePath, value) {
			connections[statePath[0]] = connections[statePath[0]] || [];
			connections[statePath[0]].push({
				comp: targetObject,
				propName: propName,
				statePath: statePath,
			});
		},
		connectAction : function (target, propName, moduleName, actionName) {
			target[propName] = function () {
				apply(modules[moduleName][actionName], arguments, modules[moduleName]);
			};
		},
		connectDispatch = function (target, name, handle) {
			target[name] = handle(dispatchAction);
		},
		connectClean = function (target, stateOption) {
			var tmp;
			for (var x in stateOption) {
				tmp = [];
				for (var i = 0, l = connections[stateOption[x][0]].length; i < l; i++) {
					if (connections[stateOption[x][0]][i].comp !== target) tmp.push(connections[stateOption[x][0]][i]);
				}
				connections[stateOption[x][0]] = tmp;
			}
		},
		// 支持5层
		// 监测变更，做数据缓存，提升性能
		getValueFromStore : function (statePath, options) {
			if(typeof statePath === 'string') return store[statePath];
			var state = store[statePath[0]];
			if (!statePath[1]) return state;
			else {
				state = isNaN(statePath[1]) ? state[statePath[1]] : (state[statePath[1]] || state[parseInt(statePath[1])]);
				if (!statePath[2] || typeof state !== 'object') return state;
				else {
					state = isNaN(statePath[2]) ? state[statePath[2]] : (state[statePath[2]] || state[parseInt(statePath[2])]);
					if (!statePath[3] || typeof state !== 'object') return state;
					else {
						state = isNaN(statePath[3]) ? state[statePath[3]] : (state[statePath[3]] || state[parseInt(statePath[3])]);
						if (!statePath[4] || typeof state !== 'object') return state;
						else {
							return isNaN(statePath[4]) ? state[statePath[4]] : (state[statePath[4]] || state[parseInt(statePath[4])]);
						}
					}
				}
			}
		}
	};


	var connection = {
		state: function (targetObject, propName, statePath) {
			if (!statePath[0] || !modules[statePath[0]]) throw '[TUNKJS]:unknown module name:' + statePath[0];
			var value = hooks.getValueFromStore(statePath, modules[statePath[0]].moduleOptions);
			hooks.connectState(targetObject, propName, statePath, value);
			targetObject._stateOptions_ = targetObject._stateOptions_ || {};
			targetObject._stateOptions_[propName] = statePath;
			//返回组件默认数据
			return value;
		},
		action: function (target, propName, moduleName, actionName) {
			if (!modules[moduleName]) throw '[TUNKJS]:unknown module name ' + moduleName;
			if (!modules[moduleName][actionName]) throw '[TUNKJS]:unknown action name ' + action[1] + ' of ' + moduleName;
			if (!modules[moduleName][actionName].actionOptions) throw '[TUNKJS]:the method ' + action[1] + ' of ' + moduleName + ' is not an action';
			hooks.connectAction(target, propName, moduleName, actionName);
		},

		dispatch: function (target, name, handle) {
			hooks.connectDispatch(target, name, handle);
		},

		clean: function (target) {
			if (target._stateOptions_)
				hooks.connectClean(target, target._stateOptions_);
		},

		getState: function (moduleName) {
			if (!modules[moduleName]) throw '[TUNKJS]:unknown module name ' + moduleName;
			return store[moduleName];
		},

		getModule: function (moduleName) {
			if (!modules[moduleName]) throw '[TUNKJS]:unknown module name ' + moduleName;
			return modules[moduleName];
		},
	};

	// tunk.hook(hookName, function(origin){
	// 		return function(...args){
	//			return origin.call(null, args); 
	// 		}
	// });
	// Aspect Oriented Programming
	function hook(hookName, func) {
		var originHook = hooks[hookName];
		if (!originHook) throw '[TUNKJS]:hook ' + hookName + ' is not exist';
		if (typeof func !== 'function') throw '[TUNKJS]:the second argument should be a function';
		func = func(originHook);
		if (typeof func !== 'function') throw '[TUNKJS]:the function should return a hook function';
		hooks[hookName] = func;
	}

	function addMiddleware(middleware) {
		if (typeof middleware === 'object' && middleware.constructor === Array)
			middlewares = middlewares.concat(middleware);
		else if (typeof middleware === 'function') middlewares.push(middleware);
		return tunk;
	};

	function mixin(obj) {
		Object.assign(mixins, obj);
		return tunk;
	};



	function createModule(module, opts) {

		var name = opts.name;

		if (!name) throw '[TUNKJS]:the name of module was required.';
		if (modules[name]) throw '[TUNKJS]:the module ' + name + ' already exists';

		opts = Object.assign({}, configs, opts);

		module = constructModule(module, opts);

		modules[name] = hooks.initModule(module, store, name, opts);

		defineHiddenProps(modules[name], {__stateFreezed__: false})

		var defaultState = modules[name].state;

		if (typeof defaultState !== 'undefined' && typeof defaultState !== 'object') {
			throw '[TUNKJS]:object type of the default state is required';
		} else if (typeof defaultState === 'undefined') store[name] = {};

		return modules[name];

	}

	function decorateWatcher(target, watchPath, opts) {
		if (typeof watchPath !== 'string' || (watchPath = watchPath.split('.')).length !== 2)
			throw '[TUNKJS]:the path you watch should be like moduleName.stateName';
		opts = Object.assign({ watchPath: watchPath }, opts);
		target.watcherOptions = opts;
		return target;
	}

	function decorateAction(target, opts) {
		if (target.watcherOptions) throw '[TUNKJS]:you can not set a watcher method to be an action';
		target.actionOptions = Object.assign({}, opts);
		return target;
	}

	
	function createAction(moduleName, actionName, originAction) {
		return action;
		function action() {
			var prevOpts = this.dispatch.options, 
				result;
			action.actionOptions = action.actionOptions || Object.assign({actionName: actionName}, this.moduleOptions, originAction.actionOptions);
			this.dispatch.options = action.actionOptions
			result = hooks.callAction(originAction, arguments, this, action.actionOptions);
			this.dispatch.options = prevOpts;
			return result;
		}
	}

	
	function createWatcher(moduleName, watcherName, originWatcher) {

		var watchPath = originWatcher.watcherOptions.watchPath;

		if (moduleName === watchPath[0]) throw '[TUNKJS]:you cannot watch the state of current module';

		watchers[watchPath[0]] = watchers[watchPath[0]] || {};
		watchers[watchPath[0]][watchPath[1]] = watchers[watchPath[0]][watchPath[1]] || [];
		watchers[watchPath[0]][watchPath[1]].push(watcher);
		
		function watcher(newValue) {
			if (!modules[watchPath[0]])
				throw '[TUNKJS]:unknown module name ' + watchPath[0];
			var watcherOptions = watcher.watcherOptions = watcher.watcherOptions || Object.assign({watcherName:watcherName, isWatcher:true, watchPath:watchPath}, modules[moduleName].moduleOptions, originWatcher.watcherOptions);
			var preOpts = modules[moduleName].dispatch.options;
			modules[moduleName].dispatch.options = watcherOptions;
			hooks.callWatcher(originWatcher, newValue, modules[moduleName], watcherOptions);
			modules[moduleName].dispatch.options = preOpts;
		}
		return banCallingWatcher;
	}

	function banCallingWatcher() { throw '[TUNKJS]:you can\'t call watcher directly'; }

	function constructModule(module, opts) {

		var name = opts.moduleName = opts.name;

		var protos = module.prototype;

		var properties = getProperties(module);

		for (var i = 0, l = properties.length; i < l; i++) if (protos[properties[i]]) {
			protos[properties[i]] = hooks.override(name, protos, properties[i]);
		}

		Object.assign(protos, mixins, protos, {
			getState: function getState(path) {
				if (!path) return hooks.getValueFromStore(name, modules[statePath[0]].moduleOptions);
				else {
					var statePath = path.split('.');
					if (!modules[statePath[0]]) throw '[TUNKJS]:can\' not find the module ' + statePath[0];
					if (statePath.length === 1)
						return hooks.getValueFromStore(statePath[0], modules[statePath[0]].moduleOptions);
					else return hooks.getValueFromStore(statePath, modules[statePath[0]].moduleOptions);
				}
			},
			dispatch:dispatch
		});

		protos.moduleOptions = opts;

		defineHiddenProps(protos, protos);

		function dispatch() {
			return run_middlewares(this, arguments, {
				options: dispatch.options || protos.moduleOptions,
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
					if (!this.__stateFreezed__) {
						if (store[name]) Object.assign(store[name], state);
						else store[name] = Object.assign({}, state);
					} else throw '[TUNKJS]:you could just initialize state by setting an object to state, please use dispatch instead.';
				}
			}
		});

		return module;
	}

	function run_middlewares(module, args, context, dispatch) {

		var index = 0;

		return next(args);

		function next(args) {
			if (typeof args !== 'object' || isNaN(args.length)) throw '[TUNKJS]:the param of next should be type of array or arguments';
			if (index < middlewares.length)
				return apply(middlewares[index++](dispatch, next, end, context), args, module);
			else {
				if (args[0] && typeof args[0] === 'object') {
					if (typeof args[0].then !== 'function') {
						return end(args[0]);
					} else {
						return args[0].then(function (data) {
							if (typeof data === 'object' && typeof args[0].then !== 'function') {
								return end(data);
							} else {
								index = 0;
								return next(data);
							}
						});
					}
				} else {
					return args[0];
				}
			}
		}

		function end(result) {
			if (context.options.isWatcher) throw '[TUNKJS]:A watcher could not update store directly';
			hooks.storeNewState(result, context.moduleName, context.options);
			return result;
		}
	}

	function dispatchAction(moduleName, actionName, argsArray) {
		if (!modules[moduleName]) throw '[TUNKJS]:unknown module name ' + moduleName + '.';
		if (!modules[moduleName][actionName]) throw '[TUNKJS]:unknown action name ' + actionName + ' of ' + moduleName + '';
		if (!modules[moduleName][actionName].actionOptions) throw '[TUNKJS]:the method ' + actionName + ' of ' + moduleName + ' is not an action';
		return apply(modules[moduleName][actionName], argsArray, modules[moduleName]);
	}

	function defineHiddenProps(obj, props) {
		for (var x in props) {
			Object.defineProperty(obj, x, {
				value: props[x],
				enumerable: false,
				writable: false,
				configurable: false
			});
		}
	}

	function getProperties(clas) {
		var proto = clas.prototype;
		var protos = Object.getOwnPropertyNames(proto), properties;
		while (proto.__proto__ && proto.__proto__.constructor.name !== 'Object') {
			properties = Object.getOwnPropertyNames(proto.__proto__);
			for (var i = 0; i < properties.length; i++) {
				if (protos.indexOf(properties[i]) === -1) protos.push(properties[i]);
			}
			proto = proto.__proto__;
		}

		return protos;
	}



	// action middleware, the first middleware
	addMiddleware(function (dispatch, next, end, context) {
		return function (name, options) {
			if (typeof name !== 'string') {
				return next(arguments);
			}
			if (name.indexOf('.') === -1) name = [context.moduleName, name];
			else name = name.split('.');
			if (!context.modules[name[0]]) throw '[TUNKJS]:unknown module name ' + name[0];
			if (!context.modules[name[0]][name[1]]) throw '[TUNKJS]:unknown action name ' + name[1] + ' of ' + name[0];
			if (!context.modules[name[0]][name[1]].actionOptions) throw '[TUNKJS]:the method ' + name[1] + ' of ' + name[0] + ' is not an action';
			return apply(context.modules[name[0]][name[1]], Array.prototype.slice.call(arguments, 1), context.modules[name[0]]);
		};
	});

	
	if (typeof module === 'object' && module.exports) {
		module.exports = tunk;
	}
	else if (typeof define === 'function' && define.amd) {
		define(function () {
			return tunk;
		})
	}

})();

