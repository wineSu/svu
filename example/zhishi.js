您好，我叫苏哲，16年毕业，现就职于某网络公司前端开发。
日常负责部门业务线的前端相关工作维护，有大型项目的开发和架构经验
业余时间喜欢维护自己的博客和一些源码学习


// 作用域、闭包、模块：单例模式---------------------------
var foo = (function moudel(id){
    let s = 11;
    function change(){
        //修改公共API
        public.one = two;
        public.s = s++;
    }
    function one(){
        console.log(id);
    }
    function two(){
        console.log(id.toUpperCase());
    }
    var API = {
        change:change,
        identify:one
    }
    return API;
})('foo moudel')

// 快速排序---------------------------------------------
function quick_sort(s, l, r){
    if(l > r){return}
    let i = l, j = r;
    let x = s[l]; //s[l]即s[i]就是第一个坑
    while (i < j){
        // 从右向左找小于x的数来填s[i]
        while(i < j && s[j] >= x){
            j--;  
        }
            
        if(i < j) {
            //将s[j]填到s[i]中，s[j]就形成了一个新的坑
            s[i] = s[j]; 
            i++;
        }

        // 从左向右找大于或等于x的数来填s[j]
        while(i < j && s[i] < x){ i++;   }
            
        if(i < j) {
            //将s[i]填到s[j]中，s[i]就形成了一个新的坑
            s[j] = s[i]; 
            j--;
        }
    }
    //退出时，i等于j。将x填到这个坑中。
    s[i] = x;
    quick_sort(s, l, i - 1)
    quick_sort(s, i + 1, r)
    return s
}
let s = [1,12,4,8, 6,3,10]
quick_sort(s, 0, s.length - 1)

// jq 源码
选择器：
    token、seed（选择器的最后一个dom选择）、编译（从右往左选择，但只是创建好闭包）、匹配（这里执行编译的结果，一次性完成匹配结果）

动画部分设计：
    多个动画使用队列，先进先出，执行时取出队头任务，判断如果还有下一个任务，则将当前状态设为进行中，执行完出队，再继续找下一个
    1.通过 requestAnimationFrame 开启动画，维护一个 timers 队列，这个队列用来计算每个任务的进度是否到达100%，如果不到则一致执行当前任务
    2.tick进行进度值计算（1 - 总时间+开始时间-当前时间  /  总时长），tween进行具体的dom移动操作
    3.控制动画停止，进度直接到达100%或者直接删除掉timer中的任务

// 前端状态库对比-----------------------------------------
Elm 模型，ui => state，全局组件树，副作用（中间件表示）（纯函数思想，数据不可变）
redux数据流 就是 通过全局store dispitch派发action，根据action类型再经过reducer处理数据
中间件机制：增强disitch，即支持派发一个函数，如果为普通action对象，中间件中通过第二层的方法的next参数（就是dispatch）触发，
否则就是通过中间件第三层action（即用户传入的函数）来执行，并将原有的dispatch传入进入，这样业务代码中使用即可

react-redux-hooks
1.provider提供，挂载全局store
2.useDispatch 实现, 从context中取到store直接返回这个dispatch方法就行（redux中自带的）
3.useSelector 实现，store.subscribe注册更新函数，更新函数里面去数据钱比较决定是否更新state

redux-saga
一个异步中间件，大概做的事情就是generator 中的 yield 流程控制， take 和 put （dispatch）的过程

vuex
1.注册模块
2.事件的订阅
3.dispatch发布事件
它的中间件就是发布订阅  和 redux 中不一样

// react源码  fiber  hooks设计 其他api suspense  调度
整体模块：
    调度器Scheduler、协调器Reconciler（diff、生成fiber）可中断、Renderer渲染器

代数效应：
    代数效应是函数式编程中的一个概念，用于将副作用从函数调用中分离。
    对于类似useState、useReducer、useRef这样的Hook，我们不需要关注FunctionComponent的state在Hook中是如何保存的，React会为我们处理。

fiber 的架构
    链表树，保证任务可终端，避免了以往的一直递归问题，调度原理就是避免js线程和渲染线程的资源抢占
    双缓存机制，当前界面上为current fiber，正在内存中构建的树为wip 树，alternate属性连接。
    更新数据时先从alternate取，避免重复创建，没有的话就创建一个新的fiber节点

调度原理：
    避免js线程和渲染线程的资源抢占，频繁发起一个宏任务，根据事件循环机制避免js的长时间占用资源。
    调度事件推入一个队列，flushWork 时判断任务是否存在，存在则递归调用执行flush，需要发起调度（此时发起一个宏任务，让出资源占用）
    当渲染一个长列表的时候，在任务中的next中会仍然返回reconcileWork自身，证明当前时间片的长列表没有渲染完，则此时任务不出队，重新添加自身callback继续执行

hooks实现原理：
    闭包、代数效应的体现
    mount时获取当前hook使用的是mountWorkInProgressHook，而update时使用的是updateWorkInProgressHook
    找到对应的hook，根据update计算该hook的新state并返回
    数据结构：
        useState存在于memosizeState
        useEffect存在于updateQueue
        hooks是一个链表，各个hooks中存在memosizedState为初始值，如果有事件更新创建一个更新链表
        计算好值后开始调度

优先级中断更新原理：
    状态不丢失：wip
    连续： 
    // baseState: ''
    // shared.pending: A1 --> B2 --> C1 --> D2

    // 第一次render，优先级为1。
    // baseState: ''
    // baseUpdate: null
    // render阶段使用的Update: [A1, C1]
    // memoizedState: 'AC'

    // 第二次render 优先级为2，相当于C1会被重复执行
    // baseState: 'A'
    // baseUpdate: B2 --> C1 --> D2
    // render阶段使用的Update: [B2, C1, D2]
    // memoizedState: 'ABCD'

diff实现：
    初始加载 fiber构建：
        进入 reconcileChildrenArray
        进入 if (oldFiber === null) {} 遍历所有子节点（这里的逻辑是新节点的创建）
        执行 createChild 里面构建 retrun 构建父节点
        执行 previousNewFiber = _newFiber;
        执行 previousNewFiber.sibling = _newFiber; 构建兄弟

    更新时 fiber构建：
        由于关系初始已经构建完成，更新时有可能复用节点（会删除被复用节点的兄弟），
        所以只需要在 diff 第二个遍历中不停构建兄弟关系即可：previousNewFiber.sibling = newFiber;
        注意的是如果新增的节点会走进上面说的那个 if (oldFiber === null) {} 逻辑同上

        lastPlacedIndex 一直在更新，初始为 0，表示访问过的节点在旧集合中最右的位置（即最大的位置）。
        如果新集合中当前访问的节点比 lastPlacedIndex 大，说明当前访问节点在旧集合中就比上一个节点位置靠后，则该节点不会影响其他节点的位置，
        因此不用添加到差异队列中，即不执行移动操作。只有当访问的节点比 lastPlacedIndex 小时，才需要进行移动操作
    
    diff过程只是key和tag等的对比，到了 updateHostComponent 中进行props等的对比并打标记，在completeUnitOfWork阶段进程effectList的生成

    commit阶段就可以通过effectList进行更新（个人喜欢链表表述，但是react中目前去掉了）
        第一阶段执行useEffect
        第二阶段执行dom操作，组件销毁回调 ref销毁
        第三阶段执行LayoutEffects fiber树切换 setState 回调（所以回调里能立即取到最新值）、ref 的挂载等
    
批量更新：
    批量更新就是 executionContext 的控制

// vue源码 -------------------------------------------
vue2: 通过observe进行数据的变化监听，watcher通过dep收集自身，保存界面渲染回调，当有数据变化时，会触发dep中任务列表，从而更新页面
vue3: 1.创建响应式Proxy，取值 track，赋值trigger
      2.当在effect中取值时，存储的是用户创建的各个对象  
        targetMap(weakMap)【多次的reciver】 --> depsMap(Map)【reciver数据中不同的键】 --> dep(Set)[用来发布订阅的执行 effect] 
      3.赋值时候，通过如上的数据结构，找到修改key，来执行所有的effect回调即可
      
      runtime：
        加载时创建effect添加响应式
      编译：
        ast transform 生成

// webpack 构建流程、loader原理和编写、tapable ---------
    1. 校验配置文件 ：读取命令行传入或者 webpack.config.js 文件，初始化本次构建的配置参数
    2. 生成 Compiler 对象：执行配置文件中的插件实例化语句 new MyWebpackPlugin()，为 webpack 事件流挂上自定义hooks
    3. 进入 entryOption 阶段：webpack 开始读取配置的 Entries，递归遍历所有的入口文件
    4. run/watch：如果运行在 watch 模式则执行 watch 方法，否则执行 run 方法
    5. compilation：创建 Compilation 对象回调 compilation 相关钩子，依次进入每一个入口文件(entry)，使用 loader 对文件进行编译。
        通过 compilation 可以读取到 module 的 resource（资源路径）、loaders（使用的loader）等信息。
        再将编译好的文件内容使用 acorn 解析生成 AST 静态语法树。然后递归、重复的执行这个过程， 所有模块和和依赖分析完成后，
        执行 compilation 的 seal 方法对每个 chunk 进行整理、优化、封装 __webpack_require__ 来模拟模块化操作.
    6. emit：所有文件的编译及转化都已经完成，包含了最终输出的资源，我们可以在传入事件回调的 compilation.assets 上拿到所需数据，其中包括即将输出的资源、代码块 Chunk 等等信息。

    loader原理：
        创建阶段
            1.实例化ruleset 
            RuleSet相当于一个规则过滤器，会将resourcePath应用于所有的module.rules规则，从而筛选出所需的loader。
            Ruleset 在内部会有一个默认的 module.defaultRules 配置，在真正加载 module 之前会和 webpack config 配置文件当中的自定义 module.rules 进行合并，
            然后转化成对应的匹配过滤器，在配置中我们可以写各种格式的规则，Ruleset最终将这些格式统一处理为一致。
            2.解析 inline-loader
            3.过滤出需要的loader
            4. 组合loader [post loader, inline loader, normal loader, pre loader]
        运行阶段：
            loader-runner中定义了 loader插件所用的 api、异步执行、pitch执行顺序等，loaderIndex贯穿全局，代表loader的索引。

    compilation 实例能够访问所有的模块和它们的依赖（大部分是循环依赖）。 它会对应用程序的依赖图中所有模块， 进行字面上的编译(literal compilation)。 
    在编译阶段，模块会被加载(load)、封存(seal)、优化(optimize)、 分块(chunk)、哈希(hash)和重新创建(restore)。
    一个 compilation 对象表现了当前的模块资源、编译生成资源、变化的文件、以及被跟踪依赖的状态信息，代表一次资源的构建

// 代码生成工具 ---------------------------------------

// gulp        ---------------------------------------

// charts    ----------------------------------------
