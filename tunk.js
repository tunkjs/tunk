
(function () {

	var apply = require('apply.js');

	var store,
		modules = {},
		mixins = {},
		middlewares = [],
		configs = {
			strict: true
		};

	function Store() {
		this.state = {};
	}
	Store.constructor = Store;
	_defineHiddenProps(Store.prototype, {
		getState: function (path) {
			if (typeof path === 'string') path = path.split('.');
			else if (!path || path.constructor !== Array) throw '[tunk]:wrong argument of getState';
			if (!this.state[path[0]]) throw '[tunk]: unknown module name ' + path[0];
			var state = this.state[path[0]];
			for (var i = 1, l = path.length; i < l; i++) {
				if (path[i] && typeof state === 'object') {
					state = isNaN(path[i]) ? state[path[i]] : (state[parseInt(path[i])] || state[path[i]]);
				}
			}
			return _clone(state);
		},
		setState: function (moduleName, state) {
			var keys, keysResult, toUpdate;
			if (this.state[moduleName]) {
				keys = Object.keys(this.state[moduleName]);
				keysResult = Object.keys(state);
				toUpdate = {};

				for (var i = 0; i < keysResult.length; i++)
					if (keys.indexOf(keysResult[i]) > -1)
						toUpdate[keysResult[i]] = state[keysResult[i]];

				_assign(this.state[moduleName], _clone(toUpdate));
				return toUpdate;

			} else if (state) {
				this.state[moduleName] = _assign({}, _clone(state));
				return state
			}
		}
	});


	function tunk(_store) {
		if(!_store.setState || !_store.getState) throw '[tunk]:the store should had method setState & getState';
		store = _store;
	}

	tunk.config = function (conf) {
		_assign(configs, conf);
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
			target[property].options = _assign({ isAction: true }, opts);
			return target[property];
		}
	}

	tunk.create = function () {
		var moduleName, opts, module;

		if (typeof arguments[0] === 'function') {
			if (!arguments[0].__getName__) throw '[tunk]:you should set a module name like "@create(\'ModuleName\')" or using webpack plugin tunk-loader.';
			module = hooks.compose(arguments[0], _assign({ moduleName: arguments[0].__getName__() }, configs));
			return hooks.initialize(module, module.prototype.options);
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
			if (!moduleName) throw '[tunk]:you should set a module name like "@create(\'ModuleName\')" or using webpack plugin tunk-loader.';
			opts = _assign({ moduleName: moduleName }, configs, opts);
			module = hooks.compose(arguments[0], opts);
			return hooks.initialize(module, module.prototype.options);
		};
	}

	tunk.Action = function (target, opts) {
		target.options = _assign({ isAction: true }, opts);
		return target;
	};

	/**
	tunk.Create('Ajax', {
		constructor:function Ajax(){},
		get:tunk.Action(function(){}, {}),
		base(){},
	}, options);
	 */
	tunk.Create = function (moduleName, protos, opts) {
		if (typeof moduleName !== 'string') throw '[tunk]:the name of module is required when creating a module with tunk.createModule().';
		if (!protos || typeof protos !== 'object' || !protos.constructor || typeof protos.constructor !== 'function')
			throw '[tunk]:the second param as the prototype of the module class should be an object and had its constructor.';
		if (!protos.constructor.prototype) throw '[tunk]:with Create, the constructor should be {constructor: function(){}} or {constructor: () => {}}, but not be { constructor(){} }';

		var module = protos.constructor;
		_assign(module.prototype, protos);
		module = hooks.compose(module, _assign({ moduleName: moduleName }, configs, opts));
		return hooks.initialize(module, module.prototype.options);
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

		compose: function (module, opts) {

			var moduleName = opts.moduleName;

			if (!moduleName) throw '[tunk]:the name of module was required.';

			var protos = module.prototype;

			protos.moduleName = moduleName;

			var properties = _getProperties(module);

			for (var i = 0, l = properties.length; i < l; i++) if (protos[properties[i]]) {
				protos[properties[i]] = hooks.override(moduleName, protos, properties[i], _assign({ actionName: properties[i] }, opts, protos[properties[i]].options || {}));
			}

			_assign(protos, mixins, protos, {
				getState: function getState(key) {
					return hooks.getState(key, opts);
				},
				dispatch: dispatch
			});

			protos.options = opts;

			_defineHiddenProps(protos, protos);

			function dispatch() {
				return hooks.runMiddlewares(this, arguments, dispatch, dispatch.options || protos.options);
			}

			Object.defineProperties(protos, {
				'state': {
					get: function () {
						return hooks.getState(opts.moduleName, opts);
					},
					set: function (state) {
						if (!this.__stateFreezed__) {
							hooks.setState(state, opts);
						} else throw '[tunk]:you could just initialize state by setting an object to state, please use dispatch instead.';
					}
				}
			});

			return module;
		},

		initialize: function (module, opts) {

			var moduleName = opts.moduleName;

			if (modules[moduleName]) throw '[tunk]:the module ' + moduleName + ' already exists';

			if(!store) store = new Store();

			modules[moduleName] = new module();

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

		callAction: function (originAction, args, module, options) {
			var result = apply(originAction, args, module);
			if (typeof result !== 'undefined') {
				return module.dispatch(result);
			}
		},

		runMiddlewares: function (module, args, dispatch, options) {
			var index = 0,
				checkEndlessLoop = 0;
			return next(args);
			function next(args) {
				if (!args[0]) return args[0];
				if (checkEndlessLoop++ > 1024) throw '[tunk]: Endless loop in middlewares.';
				if (typeof args !== 'object' || isNaN(args.length)) throw '[tunk]:the param of next should be type of array or arguments';
				if (index < middlewares.length) {
					return apply(middlewares[index++](dispatch, next, options), args, module);
				} else {
					index = 0;
					return next(args);
				}
			}
		},

		setState: function (newState, options) {
			return store.setState(options.moduleName, newState);
		},

		getState: function (path, options) {
			if (!path) path = options.moduleName;
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
	 * utils.addMiddleware([function (dispatch, next, options) {
			return function () {
				return next(arguments);
			}
		}]);
	*/
	function addMiddleware(middleware) {
		// 使数据存储组件永远在其他组件后面
		var storeMiddleware = middlewares.pop();
		if (typeof middleware === 'object' && middleware.constructor === Array)
			middlewares = middlewares.concat(middleware);
		else if (typeof middleware === 'function') middlewares.push(middleware);
		middlewares.push(storeMiddleware);
		return tunk;
	}
	addMiddleware.__reset = function () {
		var storeMiddleware = middlewares.pop();		
		while (middlewares.length > 2) middlewares.pop();
		middlewares.push(storeMiddleware);		
	}

	function mixin(obj) {
		_assign(mixins, obj);
		return tunk;
	}


	function dispatchAction(moduleName, actionName, argsArray) {
		if (!modules[moduleName]) throw '[tunk]:unknown module name ' + moduleName + '.';
		if (!modules[moduleName][actionName]) throw '[tunk]:unknown action name ' + actionName + ' of ' + moduleName + '';
		if (!modules[moduleName][actionName].options || !modules[moduleName][actionName].options.isAction) throw '[tunk]:the method ' + actionName + ' of ' + moduleName + ' is not an action';
		return apply(modules[moduleName][actionName], argsArray || [], modules[moduleName]);
	}

	function _clone(obj) {
		if (typeof obj === 'object') {
			return configs.strict ? JSON.parse(JSON.stringify(obj)) : obj.constructor === Array ? obj.slice() : _assign({}, obj);
		} else return obj;
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

	function _assign() {
		var args = arguments;
		for (var i = 0, l = args.length; i < l; i++) {
			if (args[i + 1] && typeof args[i + 1] === 'object') for (var x in args[i + 1]) {
				args[0][x] = args[i + 1][x];
			}
		}
		return args[0];
	}

	// action middleware, the first middleware
	middlewares.push(function (dispatch, next, options) {
		return function (name) {
			if (typeof name !== 'string') {
				return next(arguments);
			}
			if (name.indexOf('.') === -1) name = [options.moduleName, name];
			else name = name.split('.');
			return dispatchAction(name[0], name[1], Array.prototype.slice.call(arguments, 1))
		};
	});

	// promise middleware
	middlewares.push(function (dispatch, next, options) {
		return function (obj) {
			if (obj && typeof obj === 'object' && obj.then && typeof obj.then === 'function') {
				return obj.then(function (data) {
					if (typeof data !== 'undefined') {
						var prevOpts = dispatch.options;
						dispatch.options = options;
						var result = dispatch(data);
						dispatch.options = prevOpts;
						return result;
					}
				});
			} else return next(arguments);
		};
	});

	// store middleware
	middlewares.push(function (dispatch, next, options) {
		return function (result) {
			if (arguments.length === 1 && result && typeof result === 'object' && typeof result.then !== 'function') {
				hooks.setState(result, options);
				// 考虑ing这个数据是否有必要隔离引用
				return result;
			} else {
				return next(arguments);
			}
		}
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

