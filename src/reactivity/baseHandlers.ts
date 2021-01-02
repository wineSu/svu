import { Target } from '../shared/svu';
import { 
  hasChanged
} from '../shared';
import { 
  track,
  trigger
} from './effect';

function createGetter(){
  return (
    target: Target,
    key: string | symbol,
    receiver: object
  ) => {
    let res = Reflect.get(target, key, receiver);
    track(target, key);
    return res;
  }
}

function createSetter(){
  return (
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean => {
    const oldValue = (target as any)[key];
    const result = Reflect.set(target, key, value, receiver);
    // 数据有变化再更新 避免在effect中触发数据变化 state.count = xx 死循环
    if(hasChanged(value, oldValue)){
      trigger(target, key, value);
    }
    return result;
  }
}

const get = createGetter();
const set = createSetter();

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
}