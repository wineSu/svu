import {
    ReactiveEffect,
    ComputedGetter,
    ComputedSetter,
    WritableComputedOptions
} from '../shared/svu';

import { isFunction } from '../shared';
import { effect } from './effect';
import {
    ref
} from './ref';

class ComputedRefImpl<T>{
    private _value!: T;
    public readonly effect: ReactiveEffect;

    constructor(getters: ComputedGetter<T>, private setters: ComputedSetter<T>){
        this.effect = effect(getters, {
            lazy: true
        });
    }

    get value(){
        this._value = this.effect();
        return this._value;
    }

    set value(newVal){
        this.setters(newVal);
    }
}

export function computed<T>(
    options: any
){
    // let getters, setters;
    // if(isFunction(options)){
    //     getters = options;
    //     setters = () =>{};
    // }else{
    //     getters = options.get;
    //     setters = options.set;
    // }
    // return new ComputedRefImpl(getters, setters);
    let refVal: any = ref();
    effect(() => {
        refVal.value = options();
    })
    return refVal
}
