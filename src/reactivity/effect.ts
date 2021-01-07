import { 
    isArray
} from '../shared';
import {
    ReactiveEffect,
    KeyToDepMap,
    ReactiveEffectOptions
} from '../shared/svu'

/**
 * 三层数据结构组合
 * targetMap(weakMap)【多次的reciver】
 *    |
 * depsMap(Map)【reciver数据中不同的键】
 *    |
 * dep(Set)[用来发布订阅的执行 effect]
 */
let activeEffect: ReactiveEffect | undefined;
const targetMap = new WeakMap<any, KeyToDepMap>();

export function track(target: object, key: unknown) {
    if(activeEffect){
        let depsMap = targetMap.get(target);
        if(!depsMap){
            targetMap.set(target, (depsMap = new Map()));
        }

        let dep = depsMap.get(key);
        if(!dep){
            depsMap.set(key, (dep = new Set()));
        }

        if(!dep.has(activeEffect)){
            dep.add(activeEffect);
        }
    }
}

export function trigger(
    target: object,
    key: unknown,
    newValue?: unknown
) {
    const depsMap = targetMap.get(target);
    if(!depsMap){
        return;
    }

    const effects = new Set<ReactiveEffect>()
    const add = (effectsToAdd: Set<ReactiveEffect> | undefined) => {
        if (effectsToAdd) {
          effectsToAdd.forEach(effect => {
            // 避免effect 中 state.count++ 操作死循环
            if (effect !== activeEffect) {
              effects.add(effect)
            }
          })
        }
    }

    // 副作用收集
    if (key === 'length' && isArray(target)) {
        depsMap.forEach((dep, key) => {
          if (key === 'length' || key >= (newValue as number)) {
            add(dep)
          }
        })
    } else if (key !== void 0){
        add(depsMap.get(key))
    }

    const run = (effect: ReactiveEffect) => {
        // computed 需要
        if(effect.options.scheduler){
            effect.options.scheduler(effect);
        }else{
            effect();
        }
    }
    // 执行effect
    effects.forEach(run)
}

let uid = 0; // effect 标识
function creatReactiveEffect<T = any>(
    fn: () => T,
    options: ReactiveEffectOptions
): ReactiveEffect<T>{
    const effect = function reactiveEffect(): unknown{
        try {
            activeEffect = effect;
            return fn();
        } finally {
            activeEffect = undefined;
        }
    } as ReactiveEffect;

    // 一些辅助信息
    effect.id = uid++;
    effect._isEffect = true
    effect.active = true
    effect.raw = fn
    effect.options = options
    
    return effect;
}

export const isEffect = (
    fn: any
): fn is ReactiveEffect => fn && fn._isEffect;

// 副作用
export function effect<T = any>(
    fn: () => T,
    options: ReactiveEffectOptions = {}
): ReactiveEffect<T>{
    /**
     * 对应测试 should not double wrap if the passed function is a effect
     * const runner = effect(() => {
            console.log(111111, state.count)
        })
        const otherRunner = effect(runner)
        state.count = 11
     * 
    */ 
    if(isEffect(fn)){
        fn = fn.raw;
    }
    const effectFn = creatReactiveEffect(fn, options);
    // computed 初始不计算
    !options.lazy && effectFn();
    return effectFn;
}