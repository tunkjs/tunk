
var tunk = require('../tunk.js')

describe('tunk.create', function () {
  
  tunk.use([function(utils){

    beforeEach(function() {
      utils.modules['name'] = null;
      utils.modules['1'] = null;
    });
    afterEach(function() {
      utils.modules['name'] = null;
      utils.modules['1'] = null;
    });
    
    it('@create', function () {
      function testModule() {
        this.state = {};
      }
      testModule.__getName__ = function (){return 'name';}
      tunk.create()(testModule);
      expect(!!utils.modules.name).toBe(true);
    });

    it('@create("name")', function () {
      tunk.create('name') (function testModule() {
        this.state = {};
      });
      expect(!!utils.modules.name).toBe(true);
    });

    it('@create(null, "name")', function () {
      tunk.create('name') (function testModule() {
        this.state = {};
      });
      expect(!!utils.modules.name).toBe(true);
    });

    it('@create("1")', function () {
      tunk.create('1') (function testModule() {
        this.state = {};
      });
      expect(!!utils.modules['1']).toBe(true);
    });

    it('@create()', function () {
      try{
        tunk.create()(function testModule() {
          this.state = {};
        });
      } catch (e) {
        expect(e.indexOf('you should set a module name') > -1).toBe(true);
      }
    });

    it('@create("name", {opt: 1})', function () {
      tunk.create('name', {opt: 1})(function testModule() {
        this.state = {};
      });
      expect(utils.modules.name.options.opt).toBe(1);
    });

    it('@create(null, {name: "name"})', function () {
      tunk.create(null, {name: 'name'})(function testModule() {
        this.state = {};
      });
      expect(utils.modules.name.options.moduleName).toBe('name');
    });

    it('@create("name", new Date())', function () {
      tunk.create('name', new Date())(function testModule() {
        this.state = {};
      });
      expect(Object.keys(utils.modules.name.options).length).toBe(1);
    });

    it('tunk.Create("name")', function () {

      tunk.Create('name', {
        constructor: function () {
          this.state = {}
        }
      });
      expect(Object.keys(utils.modules.name.options).length).toBe(1);
    });

    it('tunk.Create("name") constructor () {}', function () {
      var a = function(){
        tunk.Create('name', {
          constructor () {
            this.state = {}
          }
        });
      }
      expect(a).toThrow();
    });
    
  }]);
})