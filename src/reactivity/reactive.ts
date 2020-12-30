import { 
    isObject
} from '../shared';
import {
    mutableHandlers,
} from './baseHandlers';
import {
    mutableCollectionHandlers
} from './collectionHandlers';

const reactive = (target: Object) => {
    return createReactiveobject(
        target,
        false,
        mutableHandlers
    )
}

function createReactiveobject(
    target: unknown,
    isReadonly: boolean,
    baseHandlers: ProxyHandler<any>
){
    if(!isObject(target)){
        return target;
    }
}




export {
  reactive
}

