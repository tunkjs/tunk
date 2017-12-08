var tunk = require('../tunk.js')

describe('tunk.use', function () {
    tunk.use([function (utils) {

        it('objects in utils', function () {
            expect(utils.modules &&
                utils.configs &&
                utils.modules &&
                utils.store &&
                utils.hooks &&
                utils.hook &&
                utils.addMiddleware &&
                utils.mixin &&
                !!utils.dispatchAction).toBe(true);
        });

        beforeEach(function () {
            for (var x in utils.modules) utils.modules[x] = null;
            for (var x in utils.configs) delete utils.configs[x];
        });

        afterEach(function () {
            for (var x in utils.modules) utils.modules[x] = null;
            for (var x in utils.configs) delete utils.configs[x];
        });

        describe('utils.hook', function () {
            it('hook(createModule)', function () {
                var callHook = false;
                utils.hook('createModule', function (origin) {
                    return function (module, opts) {
                        callHook = true;
                        return origin.call(null, module, opts);
                    }
                });
                tunk.create('name')(function testModule() {
                    this.state = {};
                });
                expect(callHook).toBe(true);
            });
        });

        describe('utils.store', function () {
            it('store.setState("state1", {a: 1})', function () {
                utils.store.setState('state1', {a: 1});
                expect(utils.store.getState('state1').a).toBe(1);
            });
            it('store.setState("state2", null)', function () {
                utils.store.setState('state2', null);
                expect(utils.store.getState('state2')).toBe(undefined);
            });
            it('store.setState("state1", {b: 1})', function () {
                utils.store.setState('state1', {b: 1});
                expect(utils.store.getState('state1').a).toBe(1);
            });
        });
        
        describe('utils.addMiddleware', function () {
            var num = 0;
            beforeEach(function () {
                num = 0;
            });
            it('addMiddleware(arr) next next next', function () {
                utils.addMiddleware([function (dispatch, next, end, context, options) {
                    return function (r) {
                        num++;
                        return next(arguments);
                    }
                },function (dispatch, next, end, context, options) {
                    return function (r) {
                        num++;
                        return next(arguments);
                    }
                }]);
                tunk.create('name')((function(){
                    function testModule() {
                        this.state = {};
                    }
                    testModule.prototype.action = tunk.createAction(function action(){
                        return {a: 1}
                    });
                    return testModule;
                })());
                utils.modules.name.dispatch('name.action');
                utils.modules.name.action();
                utils.dispatchAction('name', 'action');
                tunk.dispatch('name.action');
                expect(num).toBe(8);
            });
            it('to end', function () {
                utils.addMiddleware([function (dispatch, next, end, context, options) {
                    return function (r) {
                        if(num > 6) {
                            num = 6;
                            return end(arguments);
                        }else return next(arguments);
                    }
                },function (dispatch, next, end, context, options) {
                    return function (r) {
                        num++;
                        return next(arguments);
                    }
                }]);
                tunk.create('name')((function(){
                    function testModule() {
                        this.state = {};
                    }
                    testModule.prototype.action = tunk.createAction(function action(){
                        return {a: 1}
                    });
                    return testModule;
                })());
                utils.modules.name.dispatch('name.action');
                utils.modules.name.action();
                utils.dispatchAction('name', 'action');
                tunk.dispatch('name.action');
                expect(num).toBe(6);
            });
            it('error in middleware', function () {
                utils.addMiddleware([function (dispatch, next, end, context, options) {
                    return function (r) {
                        throw 'test error';
                    }
                }]);
                tunk.create('name')((function(){
                    function testModule() {
                        this.state = {};
                    }
                    testModule.prototype.action = tunk.createAction(function action(){
                        return {a: 1}
                    });
                    return testModule;
                })());
                utils.modules.name.dispatch('name.action');
                expect(num).toBe(6);
            });
        });
    }]);
});