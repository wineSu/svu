import {
    SchedulerJob
} from '../shared/svu';

/**
 * 批量更新
 * life 标识为生命周期的控制
 */
const queue: SchedulerJob[] = [];

// life
const pendingPostFlushCbs: Function[] = [];

let resolvedPromise: Promise<any> = Promise.resolve();
let currentFlushPromise: Promise<void> | null = null;

let isFlushPending = false;

// 入队
export function queueJob(job: SchedulerJob) {
    if (!queue.includes(job)) {
        queue.push(job)
        queueFlush()
    }
}

// 微任务批量执行任务
function queueFlush(){
    if(!isFlushPending){
        isFlushPending = true;
        currentFlushPromise = resolvedPromise.then(flushJobs)
    }
}

// 清空任务
function flushJobs(){
    isFlushPending = false;
    for (let i = 0, len = queue.length; i < len; i++) {
        queue[i]();
    }
    queue.length = 0;
    flushPostFlushCbs();
}

// life
function flushPostFlushCbs() {
    for (let i = 0, len = pendingPostFlushCbs.length; i < len; i++) {
        pendingPostFlushCbs[i]();
    }
    pendingPostFlushCbs.length = 0;
}

// life
export function queuePostRenderEffect(cb: Function[]) {
    pendingPostFlushCbs.push(...cb)
    queueFlush()
}

// nextTick机制
export function nextTick(
    this: any,
    fn?: () => void
): Promise<void> {
    const p = currentFlushPromise || resolvedPromise;
    return fn ? p.then(this ? fn.bind(this) : fn) : p;
}