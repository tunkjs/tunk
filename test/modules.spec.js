
var  tunk = require('../tunk.js')

var create = tunk.create;
var action = tunk.action;

describe('Modules', function() {
  describe('base use', function() {

    var testModule = function() {
      this.state = {
        a: 1,
        b: 2,
        c: 3
      };
    }

    it("create action", function() {
      expect(function() {
        testModule.prototype.changeA = tunk.createAction(function(value) {

          return {
            a: value
          }
        })
      }).not.toThrow()

    })

    it('create module', function() {
      
      //名字不为字符串抛出异常
      expect(function() {
        tunk.createModule(22, testModule)
      }).toThrow()

      //正常应该无异常抛出
      expect(function() {
        tunk.createModule("testModule", testModule)
      }).not.toThrow()

    })

    it("addMiddleware and dispact action", function() {

      var middlewareSpy = jasmine.createSpy()

      //获取初始state
      expect(tunk.connection.state(this, 'a', 'testModule.a'.split("."))).toBe(1)

      expect(function() {

        //运行中间件
        tunk.addMiddleware(function(dispatch, next, end, context){
          return function(){
            middlewareSpy()
            return next(arguments);
          }
        })

        tunk.dispatch("testModule.changeA", 44)

      }).not.toThrow()

      //获取改变后的state
      expect(tunk.connection.state(this, 'a', 'testModule.a'.split("."))).toBe(44)

      expect(middlewareSpy).toHaveBeenCalled()
    })

  })
})