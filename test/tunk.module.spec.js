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
                tunk.create('asyncModule') ((function () {
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
                                    setTimeout(() => {done()});
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
                        this.state = { a: 0 }; }
                    asyncModule.constructor = asyncModule;
                    asyncModule.prototype.myAsyncAction = tunk.Action(function action() {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve(this.dispatch('asyncModule3.myAsyncAction').then(() => {
                                    setTimeout(() => {done()});
                                }));
                            }, 500);
                        });
                    });
                    return asyncModule;
                })());
                tunk.create('asyncModule3') ((function () {
                    function asyncModule() {
                        this.state = {
                            a: 0
                        };
                    }
                    asyncModule.constructor = asyncModule;
                    asyncModule.prototype.myAsyncAction = tunk.Action(function action() {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve({a: 20});
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

        // describe('dispatch', function () {
        //     let asyncModule;
        //     beforeEach(function (done) {
        //         asyncModule = tunk.create('asyncModule2', ((function () {
        //             function asyncModule() {
        //                 this.state = { a: 0 };
        //             }
        //             asyncModule.constructor = asyncModule;
        //             asyncModule.prototype.myAsyncAction = tunk.createAction(function action() {
        //                 return new Promise(function (resolve, reject) {
        //                     setTimeout(() => {
        //                         resolve({ a: 10 });
        //                     }, 100);
        //                 });
        //             });
        //             return asyncModule;
        //         })());
        //         asyncModule.myAsyncAction().then(function(data){
        //             setTimeout(() => {
        //                 done();
        //             }, 1000);
        //         });
        //     });
        //     it("should support async execution of test preparation and expectations", function (done) {
        //         expect(asyncModule.getState().a).toBe(10);
        //         done();
        //     });
        // });

        // const syncModule = tunk.create('syncModule', ((function () {
        //     function syncModule() {
        //         this.state = { b: 0 };
        //     }

        //     syncModule.constructor = syncModule;

        //     syncModule.prototype.myAction = tunk.createAction(function action() {
        //         let res, self = this;

        //         expect(utils.store.getState('syncModule.b')).toBe(0);
        //         expect(utils.store.getState('asyncModule.a')).toBe(0);

        //         this.mySyncAction();
        //         expect(utils.store.getState('syncModule.b')).toBe(1);

        //         self.dispatch('asyncModule.myAsyncAction');
        //         expect(utils.store.getState('asyncModule.a')).toBe(0);

        //         this.dispatch('asyncModule.myAsyncAction').then((res) => {
        //             expect(res.a).toBe(11);
        //         });



        //     });

        //     syncModule.prototype.mySyncAction = tunk.createAction(function action() {
        //         return { b: this.state.b + 1 };
        //     });

        //     syncModule.prototype.myAsyncAction = tunk.createAction(function action() {
        //         return new Promise(function (resolve, reject) {
        //             setTimeout(() => {
        //                 resolve({ a: a++ });
        //             }, 100);
        //         });
        //     });

        //     return syncModule;
        // })());
        // const asyncModule = tunk.create('asyncModule', ((function () {
        //     let a = 0;
        //     function asyncModule() {
        //         this.state = { a: 0 };
        //     }
        //     asyncModule.constructor = asyncModule;
        //     asyncModule.prototype.myAsyncAction = tunk.createAction(function action() {
        //         return new Promise(function (resolve, reject) {
        //             setTimeout(() => {
        //                 resolve({ a: a++ });
        //             }, 100);
        //         });
        //     });
        //     asyncModule.prototype.mySyncAction = tunk.createAction(function action() {

        //     });
        //     return asyncModule;
        // })());

        // it('dispatch', function () {
        //     syncModule.dispatch('syncModule.myAction');
        // })


    }]);
});