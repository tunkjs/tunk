import {create, action, watch} from 'tunk';


@create({isolate:'deep'})
export default class counterText {
  //不允许异步，应该保持简单
  constructor(){
    this.state = {
      text:'hello world'
    };
  }

  @watch('counter.count')
  setText(n){
    return {text:this.getText()[n % 4]};
  }

  getText(){
    return {
      0:'hello world',
      1:'i am robert',
      2:'just do IT',
      3:'i love you'
    }
  }
}

