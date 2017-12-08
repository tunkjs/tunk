var tunk = require('../tunk.js')

describe('tunk.config', function () {
    tunk.use([function (utils) {
        beforeEach(function () {
            for (var x in utils.modules) utils.modules[x] = null;
            for (var x in utils.configs) delete utils.configs[x];
        });
        afterEach(function () {
            for (var x in utils.modules) utils.modules[x] = null;
            for (var x in utils.configs) delete utils.configs[x];
        });

        it('config', function () {
            tunk.config({ opt: 1 });
            expect(utils.configs.opt).toBe(1);
        });

        it('config to module.options', function () {
            tunk.config({ opt: 1 });
            tunk.create('name')(function testModule() {
                this.state = {};
            });
            expect(utils.modules.name.options.opt).toBe(1);
        });

        it('config to action.options', function () {
            tunk.config({ opt: 1 });
            tunk.create('name')((function(){
                function testModule() {
                    this.state = {};
                }
                testModule.prototype.action = tunk.createAction(function action(){});
                return testModule;
            })());
            expect(utils.modules.name.action.options.opt).toBe(1);
        });

    }]);
});