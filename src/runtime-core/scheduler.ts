import {
    SchedulerJob
} from '../shared/svu';

/**
 * 批量更新
 */
const queue: SchedulerJob[] = [];

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
    let job;
    while (job = queue.shift()) {
       job && job();
    }
}

// nextTick机制
export function nextTick(
    this: any,
    fn?: () => void
): Promise<void> {
    const p = currentFlushPromise || resolvedPromise;
    return fn ? p.then(this ? fn.bind(this) : fn) : p;
}