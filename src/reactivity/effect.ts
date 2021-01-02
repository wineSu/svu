import { 
    isArray
} from '../shared';
import {
    ReactiveEffect,
    KeyToDepMap
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
        effect();
    }
    // 执行effect
    effects.forEach(run)
}