import { 
    track,
    trigger
} from './effect';
import { 
    hasChanged
  } from '../shared';

export function isRef(r: any): boolean{
    return (r && r._isRef);
}

export function ref(value?: unknown){
    return createRef(value);
}

class RefImpl<T>{
    public readonly _isRef = true;
    private rawVal: T;

    constructor(val: T){
        this.rawVal = val;
    }

    get value(){
        track(this, 'value');
        return this.rawVal;
    }

    set value(newVal){
        if(hasChanged(newVal, this.rawVal)){
            this.rawVal = newVal;
            trigger(this, 'value');
        }
    }
}

function createRef(rawVal: unknown){
    return isRef(rawVal) ? 
            rawVal : 
            new RefImpl(rawVal);
}