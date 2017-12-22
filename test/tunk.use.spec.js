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


        describe('utils.store', function () {
            it('store.setState("state1", {a: 1})', function () {
                utils.store.setState('state1', { a: 1 });
                expect(utils.store.getState('state1').a).toBe(1);
            });
            it('store.setState("state2", null)', function () {
                function a() {
                    utils.store.setState('state2', null);
                    utils.store.getState('state2');
                }
                expect(a).toThrow();
            });
            it('store.setState("state1", {b: 1})', function () {
                utils.store.setState('state1', { b: 1 });
                expect(utils.store.getState('state1').a).toBe(1);
            });
        });

        // xdescribe('utils.store', function () {
        //     xdescribe('use custome store', function () {
        //         var store = {};
        //         function DataObj(val) { this.inner = val; }

        //         tunk({
        //             getState: function (key) {
        //                 return store[key];
        //             },
        //             setState: function (key, val) {
        //                 if (val && val.constructor === DataObj) store[key] = val;
        //                 else store[key] = new DataObj(val);
        //             }
        //         });

        //         xit('state in store', function () {
        //             var mark;
        //             utils.hook('store', function (origin) {
        //                 return function (newState, options) {
        //                     var result = origin.call(null, newState, options);
        //                     if (!mark) expect(store.name.inner.a).toBe(99);
        //                     mark = true;
        //                     return result
        //                 }
        //             });
        //             tunk.create('name')((function () {
        //                 function testModule() {
        //                     this.state = { a: 99 };
        //                 }
        //                 testModule.prototype.action = tunk.createAction(function action(val) {
        //                     return { b: val }
        //                 });
        //                 return testModule;
        //             })());
        //         })
        //         xit('setState', function () {
        //             utils.modules.name.action(88);
        //             expect(store.name.inner.b).toBe(88);
        //         });
        //         xit('getState', function () {
        //             expect(utils.modules.name.getState().inner.b).toBe(88);
                    
        //         });
                
        //     });
        // });

        describe('utils.hook', function () {
            it('hook(createModule)', function () {
                var callHook = false;
                utils.hook('createModule', function (origin) {
                    return function (module, opts) {
                        callHook = true;
                        return origin.call(null, module, opts);
                    }
                });
                tunk.create('name2')(function testModule() {
                    this.state = {};
                });
                expect(callHook).toBe(true);
            });
        });


        describe('utils.addMiddleware', function () {
            var num = 0;
            beforeEach(function () {
                num = 0;
                utils.modules['name'] = null;
                utils.modules['name111'] = null;
                utils.addMiddleware.__reset838383();
                for (var x in utils.configs) delete utils.configs[x];
            });

            afterEach(function () {
                utils.modules['name'] = null;
                utils.modules['name111'] = null;
                utils.addMiddleware.__reset838383();
                for (var x in utils.configs) delete utils.configs[x];
            });
            it('addMiddleware(arr) next next next', function () {
                utils.addMiddleware([function (dispatch, next, end, context, options) {
                    return function (r) {
                        num++;
                        return next(arguments);
                    }
                }, function (dispatch, next, end, context, options) {
                    return function (r) {
                        num++;
                        return next(arguments);
                    }
                }]);
                tunk.create('name')((function () {
                    function testModule() {
                        this.state = {};
                    }
                    testModule.prototype.action = tunk.createAction(function action() {
                        return { a: 1 }
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
                        if (num > 6) {
                            num = 6;
                            return end(arguments);
                        } else return next(arguments);
                    }
                }, function (dispatch, next, end, context, options) {
                    return function (r) {
                        num++;
                        return next(arguments);
                    }
                }]);
                tunk.create('name')((function () {
                    function testModule() {
                        this.state = {};
                    }
                    testModule.prototype.action = tunk.createAction(function action() {
                        return { a: 1 }
                    });
                    return testModule;
                })());
                utils.modules.name.dispatch('name.action');
                utils.modules.name.action();
                utils.dispatchAction('name', 'action');
                tunk.dispatch('name.action');
                expect(num).toBe(4);
            });

            it('error in middleware', function () {
                utils.addMiddleware([function (dispatch, next, end, context, options) {
                    return function (r) {
                        if (r && r.a === 333) throw 'test errorrrrrrrrrrr';
                    }
                }]);
                tunk.create('name111')((function () {
                    function testModule() {
                        this.state = { a: 1 };
                    }
                    testModule.prototype.action = tunk.createAction(function action(val) {
                        return { a: val }
                    });
                    return testModule;
                })());
                function a (){ utils.modules.name111.dispatch('name111.action', 333); }
                expect(a).toThrow();

            });
        });
    }]);
});