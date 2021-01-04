import { 
    Target
} from '../shared/svu';
import { 
    isObject
} from '../shared';
import {
    mutableHandlers,
} from './baseHandlers';

export const reactiveMap = new WeakMap<Target, any>();

const reactive = (target: Object) => {
    return createReactiveobject(
        target,
        mutableHandlers
    );
}

function createReactiveobject(
    target: Target,
    baseHandlers: ProxyHandler<any>
){
    if(!isObject(target)){
        return target;
    }
    const proxyMap = reactiveMap;
    const existingProxy = proxyMap.get(target);
    if(existingProxy){
        return existingProxy;
    }
    const proxy = new Proxy(
        target,
        baseHandlers
    )
    // 收集
    proxyMap.set(target, proxy)
    return proxy;
}

export {
  reactive
}

export function isReactive(value: any) {
    return !!(value && value.__v_isReactive)
  }
  
  
  export function toRaw(observed: any) {
    return true
  }

  export function markRaw(observed: any) {
    return true
  }