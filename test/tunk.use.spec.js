var tunk = require('../tunk.js')
describe('tunk.use', function () {
    tunk.use([function (utils) {

        it('objects in utils', function () {
            expect(utils.modules &&
                utils.configs &&
                utils.modules &&
                utils.hooks &&
                utils.hook &&
                utils.addMiddleware &&
                utils.mixin &&
                !!utils.runAction).toBe(true);
        });



        describe('utils.hook', function () {
            it('hook(compose)', function () {
                var callHook = false;
                utils.hook('compose', function (origin) {
                    return function (module, opts) {
                        callHook = true;
                        return origin.call(null, module, opts);
                    }
                });
                tunk.create('name2') (function testModule() {
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
                utils.addMiddleware.__reset();
                for (var x in utils.configs) delete utils.configs[x];
            });

            afterEach(function () {
                utils.modules['name'] = null;
                utils.modules['name111'] = null;
                utils.addMiddleware.__reset();
                for (var x in utils.configs) delete utils.configs[x];
            });
            it('addMiddleware(arr) next next next', function () {
                utils.addMiddleware(function (dispatch, next, options) {
                    return function (r) {
                        num++;
                        return next(arguments);
                    }
                });
                utils.addMiddleware(function (dispatch, next, options) {
                    return function (r) {
                        num++;
                        return next(arguments);
                    }
                });
                tunk.create('name') ((function () {
                    function testModule() {
                        this.state = {};
                    }
                    testModule.prototype.action = tunk.Action(function action() {
                        return { a: 1 }
                    });
                    return testModule;
                })());
                utils.modules.name.action();
                utils.runAction('name', 'action');
                expect(num).toBe(4);
            });
            

            it('error in middleware', function () {
                utils.addMiddleware(function (dispatch, next, options) {
                    return function (r) {
                        if (r && r.a === 333) throw 'test errorrrrrrrrrrr';
                    }
                });
                tunk.create('name111') ((function () {
                    function testModule() {
                        this.state = { a: 1 };
                    }
                    testModule.prototype.action = tunk.Action(function action(val) {
                        return { a: val }
                    });
                    return testModule;
                })());
                function a (){ utils.modules.name111.action(333); }
                expect(a).toThrow();

            });
        });
    }]);
});