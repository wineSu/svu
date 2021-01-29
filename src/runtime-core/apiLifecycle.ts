import {
    LifecycleHooks,
    CreateHook,
    ComponentInstance
} from '../shared/svu';

import { currentInstance } from './component';

export function injectHook(
    type: LifecycleHooks,
    hook: Function,
    target: ComponentInstance | null = currentInstance
) {
    if (target) {
        // 挂载到当前实例
        const hooks = target[type] || (target[type] = []);
        hooks.push(hook);
    }
}

export const createHook: CreateHook = (lifecycle ) => 
    (hook, target = currentInstance) =>
        injectHook(lifecycle, hook, target);

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED)
