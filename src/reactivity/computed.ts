import {
    ReactiveEffect,
    ComputedGetter,
    ComputedSetter,
    WritableComputedOptions
} from '../shared/svu';

import { isFunction } from '../shared';
import { 
    effect,
    trigger,
    track
} from './effect';

class ComputedRefImpl<T>{
    private _value!: T;
    private _dirty = true
    public readonly effect: ReactiveEffect;

    constructor(getters: ComputedGetter<T>, private setters: ComputedSetter<T>){
        this.effect = effect(getters, {
            lazy: true,
            scheduler: () => {
                if (!this._dirty) {
                  this._dirty = true
                  trigger(this, 'value')
                }
              }
        });
    }

    get value(){
        if (this._dirty) {
            this._value = this.effect()
            this._dirty = false
        }
        track(this, 'value')
        return this._value
    }

    set value(newVal){
        this.setters(newVal);
    }
}

export function computed<T>(
    options: ComputedGetter<T> | WritableComputedOptions<T>
){
    let getters, setters;
    if(isFunction(options)){
        getters = options;
        setters = () =>{};
    }else{
        getters = options.get;
        setters = options.set;
    }
    return new ComputedRefImpl(getters, setters);
}
