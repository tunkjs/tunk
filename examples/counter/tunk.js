(function() {

	var apply = require('apply.js');

	var store = {},
		modules = {},
		connections = [],
		mixins = {},
		middlewares = [],
		hook_beforeStore = [],
		hook_beforeStateInject = [],
		hook_afterStateInjected = [],
		stateUpdateHandlers = [],
		watchers = {},
		configs={
			isolate: 'deep', // deep, shallow, none
			async: true,
			debug: false
		};


	function tunk(conf) {
		Object.assign(configs, conf);
	}

	tunk.configs = configs;

	tunk.config = tunk;



	tunk.action = function action(target, property, descriptor) {
		if(target[property].watching) throw 'you can not set a watcher method to be an action';
		target[property].isAction = true;
	}

	tunk.watch = function watch(watchPath) {
		if(typeof watchPath !=='string' || (watchPath=watchPath.split('.')).length !== 2 )
			throw 'the path you watch should be like moduleName.stateName';

		return function(target, property, descriptor){
			if(target[property].isAction) throw 'you can not set a action method to be a watcher';
			target[property].watching = watchPath;
		}
	}

	tunk.extend = function (opts) {
		console.log(arguments);
		if (typeof opts === 'function') {
			return extend(opts, {});
		} else return function (target, property, descriptor) {
			return extend(target, opts);
		};
	}

	function extend(target, opts) {

		var name = target.name;
		var protos = target.prototype;

		if(!name) throw 'the name of module was required.';
		if(modules[name]) throw 'the module '+name+' already exists';

		Object.assign(protos, mixins, {
			getState: function getState(otherModuleName) {
				if (!otherModuleName) return clone(store[name], modules[name]._isolate_);
				else return clone(store[otherModuleName], modules[otherModuleName]._isolate_);
			}
		});

		var properties = Object.getOwnPropertyNames(target.prototype);

		for (var i = 0, l = properties.length; i < l; i++) if (protos[properties[i]]) {

			if (protos[properties[i]].isAction){
				protos[properties[i]] = (function (moduleName, actionName, originAction) {

					action.isAction = true;

					return action;

					function action() {
						if (configs.async) {
							var args = arguments;
							setTimeout(function () {
								var result = apply(originAction, args, modules[moduleName]);
								if (typeof result !== 'undefined') dispatch.call(modules[moduleName], result);
							}, 0);
						} else {
							var result = apply(originAction, arguments, modules[moduleName]);
							if (typeof result !== 'undefined') return dispatch.call(modules[moduleName], result);
						}
					};

					function dispatch() {
						return run_middlewares(this, arguments, {
							moduleName: moduleName,
							actionName: actionName,
							modules: modules,
							store: store,
						}, dispatch);
					}
				})(name, properties[i], protos[properties[i]]);
			}else if(protos[properties[i]].watching) {
				(function (moduleName, watcherName, watcher) {
					var watchPath = watcher.watching;

					if(moduleName===watchPath[0]) throw 'you can\'t watch the state of current module';

					watchers[watchPath[0]] = watchers[watchPath[0]] || {};
					watchers[watchPath[0]][watchPath[1]] = watchers[watchPath[0]][watchPath[1]] || [];

					watchers[watchPath[0]][watchPath[1]].push(function(newValue, fromStatePath, fromModule, fromAction){
						if(!modules[watchPath[0]])
							throw 'unknown module name ' + watchPath[0];
						var result = watcher.call(modules[moduleName], newValue, fromStatePath, fromModule, fromAction);
						if (typeof result !== 'undefined') return dispatch.call(modules[moduleName], result);
					});

					function dispatch() {
						return run_middlewares(this, arguments, {
							moduleName: moduleName,
							actionName: watcherName,
							modules: modules,
							store: store,
						}, dispatch);
					}
				})(name, properties[i], protos[properties[i]]);
			}
		}

		protos.dispatch = dispatch;

		function dispatch() {
			if(configs.async) {
				var args = arguments;
				setTimeout(function () {
					return run_middlewares(this, args, {
						moduleName: name,
						actionName: 'dispatch',
						modules: modules,
						store: store,
					}, dispatch);
				});
			}else {
				return run_middlewares(this, arguments, {
					moduleName: name,
					actionName: 'dispatch',
					modules: modules,
					store: store,
				}, dispatch);
			}
		}

		protos._isolate_ = opts.isolate;

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

		modules[name] = new target();

		var defaultState = modules[name].state;

		if(typeof defaultState !=='undefined' && typeof defaultState !=='object'){
			if(configs.debug){
				console.error('object type of the default state is required',{name:name, defaultState:defaultState});
			} else throw 'object type of the default state is required';
		}

		return modules[name];

	};


	tunk.dispatch = function (moduleName, options) {
		if (moduleName && moduleName.constructor === String)
			storeState(options, moduleName, 'TUNK');
		else throw 'the first argument should be a module name and the second shuould be a plain object';
	};

	tunk.bind = function (bindName, func) {
		if (typeof func === 'function')
			switch (bindName) {
				case 'beforeStore':
					hook_beforeStore.push(func);
					break;
				case 'beforeStateInject':
					hook_beforeStateInject.push(func);
				case 'afterStateInjected':
					hook_afterStateInjected.push(func);

			}
		else throw 'a callback as the second argument is needed';
	};

	tunk.addMiddleware = function (middleware) {
		if (typeof middleware === 'object' && middleware.constructor === Array)
			middlewares = middlewares.concat(middleware);
		else if (typeof middleware === 'function') middlewares.push(middleware);
	};

	tunk.mixin = function (obj) {
		Object.assign(mixins, obj);
	};




	tunk.connectionApi = {
		connectState: function (targetObject, stateOptions) {
			var initialState = {}, statePath;
			if (stateOptions) {
				for (var x in stateOptions) if (stateOptions.hasOwnProperty(x)) {
					statePath = stateOptions[x];
					if(!statePath[0] || !modules[statePath[0]]) throw 'unknown module name:'+statePath[0];
					connections[statePath[0]] = connections[statePath[0]] || [];
					connections[statePath[0]].push({
						comp: targetObject,
						propName: x,
						statePath: statePath,
					});

					//设置组件默认数据
					initialState[x] = pathValue(statePath);
				}
			}
			return initialState;
		},
		connectActions: function (target, actionOptions) {
			if (actionOptions) {
				var action;
				for (var x in actionOptions) if (actionOptions.hasOwnProperty(x)) {
					action = actionOptions[x];
					if (!modules[action[0]]) throw 'unknown module name ' + action[0];
					if (!modules[action[0]][action[1]]) throw 'unknown action name ' + action[1] + ' of ' + action[0];
					if(!modules[action[0]][action[1]].isAction ) throw 'the method '+action[1]+' of '+action[0]+' is not an action';
					target[x] = (function (moduleName, actionName) {
						return function () {
							apply(modules[moduleName][actionName], arguments, modules[moduleName]);
						};
					})(action[0], action[1]);
				}
			}
		},
		setDispatchMethod: function (target, name, makeDispatch) {
			target[name] = makeDispatch(function (moduleName, actionName, argsArray) {
				if (!modules[moduleName]) throw 'unknown module name ' + moduleName + '.';
				if (!modules[moduleName][actionName]) throw 'unknown action name ' + actionName + ' of ' + moduleName + '';
				if(!modules[moduleName][actionName].isAction) throw 'the method '+actionName+' of '+moduleName+' is not an action';
				apply(modules[moduleName][actionName], argsArray, modules[moduleName]);
			});
		},

		disconnect: function (target, stateOptions, actionOptions) {
			if (stateOptions) {
				var statePath, tmp;
				for (var x in stateOptions) if (stateOptions.hasOwnProperty(x)) {
					statePath = stateOptions[x];
					tmp = [];
					for (var i = 0, l = connections[statePath[0]].length; i < l; i++) {
						if (connections[statePath[0]][i].comp !== target) tmp.push(connections[statePath[0]][i]);
					}
					connections[statePath[0]] = tmp;
				}
			}
		},

		//function(targetObject, stateName, newValue, action)
		addStateUpdatedListener: function (handler) {
			stateUpdateHandlers.push(handler);
		}


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
			result = run_beforeStore_hooks(result, store[context.moduleName]);
			return storeState(result, context.moduleName, context.actionName)
		}
	}

//数据进出 store 通过 clone 隔离
	function storeState(obj, moduleName, actionName) {
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

		Object.assign(store[moduleName], changedState);

		if (pipes && pipes.length) for (var i = 0, l = pipes.length; i < l; i++) if (pipes[i]) {

			statePath = pipes[i].statePath;

			// 只更新 changedFields 字段
			if (statePath[1] && changedFields.indexOf(statePath[1]) === -1) continue;

			//减少克隆次数，分发出去的数据用同一个副本，减少调用 pathValue
			newValue = values[statePath] || (values[statePath] = pathValue(statePath));

			// 数据流入前hook
			for (var k = 0, m = hook_beforeStateInject.length; k < m; k++) {
				hook_beforeStateInject[k]({
					propName: pipes[i].propName,
					statePath:statePath,
					newState: newValue,
					moduleName: moduleName,
					actionName:actionName,
				});
			}

			for (var j = 0; j < stateUpdateHandlers.length; j++)
				stateUpdateHandlers[j](pipes[i].comp, pipes[i].propName, newValue, moduleName + '.' + actionName);

			setTimeout(function(){

				if(watchers[statePath[0]] && (watchers_=watchers[statePath[0]][statePath[1]])){
					for(var i=0,l=watchers_.length;i<l;i++) {
						watchers_[i](newValue, statePath, moduleName, actionName);
					}
				}

				for (var i = 0, l = hook_afterStateInjected.length; i < l; i++) {
					hook_afterStateInjected[i]({
						propName: pipes[i].propName,
						statePath:statePath,
						newState: newValue,
						moduleName: moduleName,
						actionName:actionName,
					});
				}
			})
		}

		return changedState;

	}

	function run_beforeStore_hooks(newState, state) {
		var result;
		for (var i = 0, l = hook_beforeStore.length; i < l; i++) {
			result = hook_beforeStore[i](newState, state);
			if (typeof result === 'object') newState = result;
		}
		return newState;
	}

	function run_beforeStateInject_hooks(meta) {
		for (var i = 0, l = hook_beforeStateInject.length; i < l; i++) {
			hook_beforeStateInject[i](meta);
		}
	}

	function run_afterStateInjected_hooks(comp, meta) {
		for (var i = 0, l = hook_afterStateInjected.length; i < l; i++) {
			hook_afterStateInjected[i](meta);
		}
	}

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

