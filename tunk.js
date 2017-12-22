
(function () {

	var apply = require('apply.js');

	var store,
		modules = {},
		mixins = {},
		middlewares = [],
		configs = {};
	
	function Store() {}
	(function(){
		var _store = {};
		Store.constructor = Store;
		_defineHiddenProps(Store.prototype, {
			// 读取数据的方式应该由store提供，tunk只做转发
			getState: function(path) {
				if(typeof path === 'string') path = path.split('.');
				else if(!path || path.constructor !== Array) throw '[tunk]:wrong argument of getState';
				if(!_store[path[0]]) throw '[tunk]: unknown module name ' + path[0];

				var state = _store[path[0]];
				if (!path[1]) return state;
				else {
					state = isNaN(path[1]) ? state[path[1]] : (state[path[1]] || state[parseInt(path[1])]);
					if (!path[2] || typeof state !== 'object') return state;
					else {
						state = isNaN(path[2]) ? state[path[2]] : (state[path[2]] || state[parseInt(path[2])]);
						if (!path[3] || typeof state !== 'object') return state;
						else {
							state = isNaN(path[3]) ? state[path[3]] : (state[path[3]] || state[parseInt(path[3])]);
							if (!path[4] || typeof state !== 'object') return state;
							else {
								return isNaN(path[4]) ? state[path[4]] : (state[path[4]] || state[parseInt(path[4])]);
							}
						}
					}
				}
			}, 
			setState: function(moduleName, state){
				if(_store[moduleName]) assign(_store[moduleName], state);
				else if(state) _store[moduleName] = assign({}, state);
			}
		});
		store = new Store();
	})();
	
	function tunk(_store) {
		if(_store) store = _store;
		else store = new Store();
		if(!store.setState || !store.getState) {
			throw '[tunk]: store object should had two methods setState & getState';
		}
	}

	tunk.config = function (conf) {
		assign(configs, conf);
		return tunk;
	}

	tunk.use = function (plugins) {
		if (plugins && plugins.constructor === Array) {
			for (var i = 0; i < plugins.length; i++) {
				apply(plugins[i], [{
					configs: configs,
					modules: modules,
					store: store,
					hooks: hooks,
					hook: hook,
					addMiddleware: addMiddleware,
					mixin: mixin,
					dispatchAction: dispatchAction
				}], tunk);
			}
		} else throw '[tunk]:the param of Array is required';
		return tunk;
	}

	tunk.action = function (opts, property) {
		if (typeof property === 'string' && opts[property]) {
			opts[property].options = { isAction: true };
			return opts[property];
		} else return function (target, property, descriptor) {
			target[property].options = assign({ isAction: true }, opts);
			return target[property];
		}
	}

	tunk.create = function () {
		var moduleName, opts;

		if (typeof arguments[0] === 'function') {
			if (!arguments[0].__getName__) throw '[tunk]:you should set a module name like "@create(\'ModuleName\')" or using webpack plugin tunk-loader.';
			return hooks.createModule(arguments[0], assign({ moduleName: arguments[0].__getName__() }, configs));
		}

		if (arguments[0]) if (typeof arguments[0] === 'string') {
			moduleName = arguments[0];
		} else if (typeof arguments[0] === 'object') {
			opts = arguments[0];
		}

		if (arguments[1]) if (typeof arguments[1] === 'string') {
			moduleName = arguments[1];
		} else if (typeof arguments[1] === 'object') {
			opts = arguments[1];
		}

		return function (target, property, descriptor) {
			moduleName = moduleName || opts && opts.name || target.__getName__ && target.__getName__();
			if(!moduleName) throw '[tunk]:you should set a module name like "@create(\'ModuleName\')" or using webpack plugin tunk-loader.';
			opts = assign({moduleName: moduleName}, configs, opts);
			return hooks.createModule(target, opts);
		};
	}

	tunk.createAction = function (target, opts) {
		target.options = assign({ isAction: true }, opts);
		return target;
	};
	
	/**
	tunk.createModule('Ajax', {
		constructor:function Ajax(){},
		get:tunk.creatAction(function(){}, {}),
		base(){},
	}, options);
	 */
	tunk.createModule = function (moduleName, module, opts) {
		if (typeof moduleName !== 'string') throw '[tunk]:the name of module is required when creating a module with tunk.createModule().';
		if(!module || !module.constructor === Object || !module.constructor || !module.constructor === Object) {
			throw '[tunk]:the second param as the prototype of the module class should be an object and had its constructor.';
		}
		var constructor = module.constructor;
		constructor.prototype = module;
		return hooks.createModule(constructor, assign({moduleName: moduleName}, configs, opts));
	};

	tunk.dispatch = function (name) {
		if (name && name.constructor === String) {
			name = name.split('.');
			if (name.length === 2) {
				return dispatchAction(name[0], name[1], Array.prototype.slice.call(arguments, 1));
			}
		}
		throw 'wrong arguments';
	};

	var hooks = {

		createModule: function (module, opts) {

			var moduleName = opts.moduleName;

			if (!moduleName) throw '[tunk]:the name of module was required.';
			if (modules[moduleName]) throw '[tunk]:the module ' + moduleName + ' already exists';

			module = _constructModule(module, opts);
			
			modules[moduleName] = hooks.initModule(module, opts);

			_defineHiddenProps(modules[moduleName], { __stateFreezed__: true });

			// 初次读取触发钩子
			var defaultState = modules[moduleName].getState();

			if (!defaultState || typeof defaultState !== 'object') {
				throw '[tunk]:default state is required';
			}

			return modules[moduleName];

		},

		override: function (moduleName, protos, protoName, options) {
			if (protos[protoName].options && protos[protoName].options.isAction) {
				return _createAction(moduleName, protoName, protos[protoName], options);
			} else return protos[protoName];
		},

		initModule: function (module, options) {
			return new module();
		},

		callAction: function (originAction, args, module, options) {
			var result = apply(originAction, args, module);
			// 处理异步动作返回的promise
			if (result && typeof result === 'object' && result.then) {
				return result.then(function (data) {
					if(!data) return data;
					var prevOpts = module.dispatch.options;
					module.dispatch.options = options;
					var result = module.dispatch(data);
					module.dispatch.options = prevOpts;
					return result;
				});
			}
			if (result) {
				return module.dispatch(result);
			}
		},

		runMiddlewares: function (module, args, context, dispatch, options) {
			var index = 0,
				checkEndlessLoop = 0;
			return next(args);
			function next(args) {
				if(!args[0]) return args[0];
				if(checkEndlessLoop++ > 1024) throw '[tunk]: Endless loop in middlewares.';
				if (typeof args !== 'object' || isNaN(args.length)) throw '[tunk]:the param of next should be type of array or arguments';
				if (index < middlewares.length) {
					var result;
					result = apply(middlewares[index++](dispatch, next, end, context, options), args, module);
					return result;
				} else {
					if (args[0] && typeof args[0] === 'object') {
						if (typeof args[0].then !== 'function') {
							return end(args);
						} else {
							return args[0].then(function (result) {
								// 值变更应重走中间件 promise --> result
								if(!result) return result;
								index = 0;
								return next([result]);
							});
						}
					} else {
						index = 0;
						return next(args);
					}
				}
			}

			function end(result) {
				store.setState(options.moduleName, result[0]);
				hooks.store(result[0], options);
				return result[0];
			}
		},

		store: function (newState, options) {},

		getState: function (path, options) {
			if(!path) path = options.moduleName;
			return store.getState(path);
		}
	};


	// tunk.hook(hookName, function(origin){
	// 		return function(arg1, arg2, arg3 ...){
	//			... your code
	//			return origin.call(null, arg1, arg2, arg3 ...); 
	// 		}
	// });
	// Aspect Oriented Programming
	function hook(hookName, func) {
		var originHook = hooks[hookName];
		if (!originHook) throw '[tunk]:hook ' + hookName + ' is not exist';
		if (typeof func !== 'function') throw '[tunk]:the second argument should be a function';
		func = func(originHook);
		if (typeof func !== 'function') throw '[tunk]:the function should return a hook function';
		hooks[hookName] = func;
	}

	/**
	 * 
	 * utils.addMiddleware([function (dispatch, next, end, context, options) {
			return function () {
				if(ok) return end(arguments);
				return next(arguments);
			}
		}]);
	 */
	function addMiddleware(middleware) {
		if (typeof middleware === 'object' && middleware.constructor === Array)
			middlewares = middlewares.concat(middleware);
		else if (typeof middleware === 'function') middlewares.push(middleware);
		return tunk;
	}
	addMiddleware.__reset838383 = function(){
		while(middlewares.length > 1){middlewares.pop()}
	}

	function mixin(obj) {
		assign(mixins, obj);
		return tunk;
	}


	function dispatchAction(moduleName, actionName, argsArray) {
		if (!modules[moduleName]) throw '[tunk]:unknown module name ' + moduleName + '.';
		if (!modules[moduleName][actionName]) throw '[tunk]:unknown action name ' + actionName + ' of ' + moduleName + '';
		if (!modules[moduleName][actionName].options || !modules[moduleName][actionName].options.isAction) throw '[tunk]:the method ' + actionName + ' of ' + moduleName + ' is not an action';
		return apply(modules[moduleName][actionName], argsArray || [], modules[moduleName]);
	}



	function _constructModule(module, opts) {

		var moduleName = opts.moduleName;

		var protos = module.prototype;

		var properties = _getProperties(module);

		for (var i = 0, l = properties.length; i < l; i++) if (protos[properties[i]]) {
			protos[properties[i]] = hooks.override(moduleName, protos, properties[i], assign({ actionName: properties[i] }, opts, protos[properties[i]].options || {}));
		}

		assign(protos, mixins, protos, {
			getState: function getState(key) {
				return hooks.getState(key, opts);
			},
			dispatch: dispatch
		});

		protos.options = opts;

		_defineHiddenProps(protos, protos);

		function dispatch() {
			return hooks.runMiddlewares(this, arguments, {
				modules: modules,
				store: store,
			}, dispatch, dispatch.options || protos.options);
		}

		Object.defineProperties(protos, {
			'state': {
				get: function () {
					return hooks.getState(opts.moduleName, opts);
				},
				set: function (state) {
					if (!this.__stateFreezed__) {
						// 初始存储触发store钩子
						store.setState(opts.moduleName, state);
						hooks.store(state, opts);
					} else throw '[tunk]:you could just initialize state by setting an object to state, please use dispatch instead.';
				}
			}
		});
		return module;
	}




	function _decorateAction(target, opts) {
		target.options = opts;
		return target;
	}

	function _createAction(moduleName, actionName, originAction, opts) {
		action.options = opts;
		return action;
		function action() {
			var prevOpts = this.dispatch.options,
				result;
			this.dispatch.options = action.options
			result = hooks.callAction(originAction, arguments, this, action.options);
			this.dispatch.options = prevOpts;
			return result;
		}
	}


	function _defineHiddenProps(obj, props) {
		for (var x in props) {
			Object.defineProperty(obj, x, {
				value: props[x],
				enumerable: false,
				writable: false,
				configurable: false
			});
		}
	}

	function _getProperties(clas) {
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

	function assign(){
		var args = arguments;
		for(var i = 0, l = args.length; i < l; i++) {
			if(args[i + 1] && typeof args[i + 1] === 'object') for( var x in args[i + 1]){
				args[0][x] = args[i + 1][x];
			}
		}
		return args[0];
	}

	// action middleware, the first middleware
	addMiddleware(function (dispatch, next, end, context, options) {
		return function (name) {
			if (typeof name !== 'string') {
				return next(arguments);
			}
			if (name.indexOf('.') === -1) name = [options.moduleName, name];
			else name = name.split('.');
			return dispatchAction(name[0], name[1], Array.prototype.slice.call(arguments, 1))
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

