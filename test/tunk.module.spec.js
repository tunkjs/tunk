var tunk = require('../tunk.js')

describe('tunk.module ', function () {

    tunk.use([function (utils) {

        utils.addMiddleware.__reset();

        describe('async action', function () {
            let asyncModule;
            it("call async action of a module", function (done) {
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
                                    setTimeout(() => {
                                        expect(utils.modules.asyncModule.getState().a).toBe(2);
                                        done();
                                    });
                                }));
                            }, 100);
                        });
                    });
                    asyncModule.prototype.myAsyncAction2 = tunk.Action(function action() {
                        return new Promise(function (resolve, reject) {
                            setTimeout(() => {
                                resolve({ a: 2 });
                            }, 200);
                        });
                    });
                    return asyncModule;
                })());
                asyncModule = utils.modules.asyncModule;
                asyncModule.myAsyncAction();

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
            it("getState()", function () {
                expect(utils.modules.asyncModule4.getState().a.b.c[0].d.e[2].f).toBe(20);
            });
            it("getState('a.b.c.2')", function () {
                expect(utils.modules.asyncModule4.getState('a.b.c.2')).toBe(2);
            });
            it("getState('a.b.c.0.d.e.2.f')", function () {
                expect(utils.modules.asyncModule4.getState('a.b.c.0.d.e.2.f')).toBe(20);
            });
        });

        describe('await this.action', function () {
            it("state update", function (done) {
                tunk.create('asyncModule5')((function () {
                    function asyncModule() {
                        this.state = { a: 0 };
                    }
                    asyncModule.constructor = asyncModule;
                    asyncModule.prototype.myAsyncAction1 = tunk.Action(function action() {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve({ a: 1 });
                            }, 100);
                        });
                    });
                    asyncModule.prototype.myAsyncAction2 = tunk.Action(function action() {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                this.myAsyncAction1().then(({ a }) => {
                                    resolve({ a: a + 1 });
                                    setTimeout(() => {
                                        expect(utils.modules.asyncModule5.getState().a).toBe(2);
                                        done();
                                    });
                                });
                            }, 100);
                        });
                    });
                    return asyncModule;
                })());
                asyncModule = utils.modules.asyncModule5;
                asyncModule.myAsyncAction2();


            });
        });


        describe('33333', function () {
            it("22222", function (done) {
                tunk.create('asyncModule6')((function () {
                    function asyncModule() {
                        this.state = { a: 0 };
                    }
                    asyncModule.constructor = asyncModule;
                    asyncModule.prototype.myAsyncAction1 = tunk.Action(function action() {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve({ a: 1 });
                            }, 100);
                        });
                    });
                    asyncModule.prototype.myAsyncAction2 = tunk.Action(function action() {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                this.myAsyncAction1().then(({ a }) => {
                                    resolve({ a: a + 1 });
                                    setTimeout(() => {
                                        expect(utils.modules.asyncModule6.getState().a).toBe(2);
                                        done();
                                    });
                                });
                            }, 100);
                        });
                    });
                    return asyncModule;
                })());
                asyncModule = utils.modules.asyncModule6;
                asyncModule.myAsyncAction2();
            });
        });


    }]);
});