
(function () {

	var apply = require('apply.js');

	var store = {},
		modules = {},
		mixins = {},
		middlewares = [],
		configs = {};

	function tunk() { }

	tunk.config = function (conf) {
		Object.assign(configs, conf);
		return tunk;
	}

	tunk.use = function (plugins) {
		if (plugins && plugins.constructor === Array) {
			for (var i = 0; i < plugins.length; i++) {
				apply(plugins[i], [{
					configs: configs,
					store: store,
					modules: modules,
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
			target[property].options = Object.assign({ isAction: true }, opts);
			return target[property];
		}
	}

	tunk.create = function () {
		var moduleName, opts;

		if (typeof arguments[0] === 'function') {
			if (!arguments[0].__getName__) throw '[tunk]:you should set a module name like "@create(\'ModuleName\')" or using webpack plugin tunk-loader.';
			hooks.createModule(arguments[0], Object.assign({ moduleName: arguments[0].__getName__() }, configs));
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
			opts = Object.assign({moduleName: moduleName || opts.name || target.__getName__()}, configs, opts);
			if (!opts.moduleName) throw '[tunk]:you should set a module name like "@create(\'ModuleName\')" or using webpack plugin tunk-loader.';
			hooks.createModule(target, opts);
		};
	}

	tunk.createAction = function (target, opts) {
		target.options = Object.assign({ isAction: true }, opts);
		return target;
	};
	
	/**
	tunk.createModule('Ajax', {
		constructor:function Ajax(){},
		get:creatAction(function(){}, {}),
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
		hooks.createModule(constructor, Object.assign({moduleName: moduleName}, configs, opts));
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

			_defineHiddenProps(modules[moduleName], { __stateFreezed__: true })

			var defaultState = modules[moduleName].state;

			if (!defaultState || typeof defaultState !== 'object') {
				throw '[tunk]:object type of the default state is required';
			} else if (typeof defaultState === 'undefined') store[moduleName] = {};

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
					return apply(middlewares[index++](dispatch, next, end, context, options), args, module);
				} else {
					if (args[0] && typeof args[0] === 'object') {
						if (typeof args[0].then !== 'function') {
							return end(args[0]);
						} else {
							return args[0].then(function (result) {
								// 值变更应重走中间件 promise --> result
								if(!result) return result;
								index = 0;
								return next(result);
							});
						}
					} else {
						index = 0;
						return next(args);
					}
				}
			}

			function end(result) {
				hooks.store(store[options.moduleName], result, options);
				return result;
			}
		},

		store: function (state, newState, options) {
			Object.assign(state, newState);
		},

		// 支持5层
		// 性能有待提升
		getValueFromStore: function (statePath, options) {
			if (typeof statePath === 'string') return store[statePath];
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


	// tunk.hook(hookName, function(origin){
	// 		return function(...args){
	//			return origin.call(null, args); 
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

	function addMiddleware(middleware) {
		if (typeof middleware === 'object' && middleware.constructor === Array)
			middlewares = middlewares.concat(middleware);
		else if (typeof middleware === 'function') middlewares.push(middleware);
		return tunk;
	}

	function mixin(obj) {
		Object.assign(mixins, obj);
		return tunk;
	}


	function dispatchAction(moduleName, actionName, argsArray) {
		if (!modules[moduleName]) throw '[tunk]:unknown module name ' + moduleName + '.';
		if (!modules[moduleName][actionName]) throw '[tunk]:unknown action name ' + actionName + ' of ' + moduleName + '';
		if (!modules[moduleName][actionName].options || !modules[moduleName][actionName].options.isAction) throw '[tunk]:the method ' + actionName + ' of ' + moduleName + ' is not an action';
		return apply(modules[moduleName][actionName], argsArray, modules[moduleName]);
	}



	function _constructModule(module, opts) {

		var moduleName = opts.moduleName;

		var protos = module.prototype;

		var properties = _getProperties(module);

		for (var i = 0, l = properties.length; i < l; i++) if (protos[properties[i]]) {
			protos[properties[i]] = hooks.override(moduleName, protos, properties[i], Object.assign({ actionName: properties[i] }, opts, protos[properties[i]].options || {}));
		}

		Object.assign(protos, mixins, protos, {
			getState: function getState(path) {
				if (!path) return hooks.getValueFromStore(moduleName, this.options);
				else {
					var statePath = path.split('.');
					if (!modules[statePath[0]]) throw '[tunk]:can\' not find the module ' + statePath[0];
					if (statePath.length === 1)
						return hooks.getValueFromStore(statePath[0], modules[statePath[0]].options);
					else return hooks.getValueFromStore(statePath, modules[statePath[0]].options);
				}
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
					return this.getState();
				},
				set: function (state) {
					if (!this.__stateFreezed__) {
						if (store[moduleName]) Object.assign(store[moduleName], state);
						else store[moduleName] = Object.assign({}, state);
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

