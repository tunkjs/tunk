var tunk = require('../tunk.js')

describe('tunk.module ', function () {

    tunk.use([function (utils) {
        // let value;
        // beforeEach(function (done) {
        //     setTimeout(function () {
        //         value = 0;
        //         // 调用done表示回调成功，否则超时。
        //         done();
        //     }, 1000);
        // });

        // // 如果在beforeEach中的setTimeout的回调中没有调用done，最终导致下面的it因超时而失败。
        // it("should support async execution of test preparation and expectations", function (done) {
        //     value++;
        //     expect(value).toBeGreaterThan(0);
        //     done();
        // });

        utils.addMiddleware.__reset838383();

        describe('async action', function () {
            let asyncModule;
            beforeEach(function (done) {
                tunk.create('asyncModule')((function () {
                    function asyncModule() {
                        this.state = {
                            a: 0
                        };
                    }
                    asyncModule.constructor = asyncModule;
                    asyncModule.prototype.myAsyncAction = tunk.Action(function action() {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve(this.myAsyncAction2().then(() => {
                                    setTimeout(() => { done() });
                                }));
                            }, 500);
                        });
                    });
                    asyncModule.prototype.myAsyncAction2 = tunk.Action(function action() {
                        return new Promise(function (resolve, reject) {
                            setTimeout(() => {
                                resolve({ a: 2 });
                            }, 1000);
                        });
                    });
                    return asyncModule;
                })());
                asyncModule = utils.modules.asyncModule;
                asyncModule.myAsyncAction();
            });
            it("call async action of a module", function (done) {
                expect(asyncModule.getState().a).toBe(2);
                done();
            });
        });

        describe('async action', function () {
            let asyncModule;
            beforeEach(function (done) {
                tunk.create('asyncModule2')((function () {
                    function asyncModule() {
                        this.state = { a: 0 };
                    }
                    asyncModule.constructor = asyncModule;
                    asyncModule.prototype.myAsyncAction = tunk.Action(function action() {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve(this.dispatch('asyncModule3.myAsyncAction').then(() => {
                                    setTimeout(() => { done() });
                                }));
                            }, 500);
                        });
                    });
                    return asyncModule;
                })());
                tunk.create('asyncModule3')((function () {
                    function asyncModule() {
                        this.state = {
                            a: 0
                        };
                    }
                    asyncModule.constructor = asyncModule;
                    asyncModule.prototype.myAsyncAction = tunk.Action(function action() {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve({ a: 20 });
                            }, 500);
                        });
                    });
                    return asyncModule;
                })());

                asyncModule = utils.modules.asyncModule2;
                asyncModule.myAsyncAction();
            });

            it("call async action of other module", function (done) {
                expect(utils.modules.asyncModule3.getState().a).toBe(20);
                done();
            });
        });

        describe('getState', function () {
            tunk.create('asyncModule4')((function () {
                function asyncModule() {
                    this.state = { a: { b: { c: [{ d: { e: [0, 1, { f: 20 }] } }, 1, 2] } } };
                }
                asyncModule.constructor = asyncModule;
                return asyncModule;
            })());
            it("this.state", function () {
                expect(utils.modules.asyncModule4.state.a.b.c[0].d.e[2].f).toBe(20);
            });
            it("getState()", function () {
                expect(utils.modules.asyncModule4.getState().a.b.c[0].d.e[2].f).toBe(20);
            });
            it("getState('asyncModule4.a.b.c.2')", function () {
                expect(utils.modules.asyncModule4.getState('asyncModule4.a.b.c.2')).toBe(2);
            });
            it("getState('asyncModule4.a.b.c.0.d.e.2.f')", function () {
                expect(utils.modules.asyncModule4.getState('asyncModule4.a.b.c.0.d.e.2.f')).toBe(20);
            });
        });
    }]);
});