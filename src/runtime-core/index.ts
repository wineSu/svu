import {
    RootRenderFunction,
    VNode,
    PatchFn,
    ShapeFlags,
    ComponentFn,
    ComponentInstance,
    SetupRenderEffectFn,
    RendererElement,
    RendererOptions,
    RendererNode
} from '../shared/svu';

import {
    createVnode
} from './vnode';

import {
    createComponentInstance,
    setupComponent
} from './component';

import {
    renderComponentRoot,
    normalizeVNode
} from './componentRenderUtils'

import { effect } from '../reactivity'

// TODO 元素加载  元素更新diff  调度异步更新  
function createRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement
>(options: RendererOptions<HostNode, HostElement>) {

    const {
        insert: hostInsert,
        remove: hostRemove,
        patchProp: hostPatchProp,
        createElement: hostCreateElement,
        createText: hostCreateText,
        createComment: hostCreateComment,
        setText: hostSetText,
        setElementText: hostSetElementText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
        setScopeId: hostSetScopeId = () => {},
        cloneNode: hostCloneNode,
      } = options;

    // 不同类型分发处理
    const patch: PatchFn = (n1, n2, container) => {
        let { shapeFlag } = n2;

        if (shapeFlag & ShapeFlags.ELEMENT) {
            processElement(n1, n2, container)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
            processComponent(n1, n2, container)
        }
    }

    // 节点渲染
    const processElement: PatchFn = (n1, n2, container) => {
        if (n1 == null) {
            // 初始加载
            mountElement(n2, container);
        } else {
            // 更新
            patchElement(n1, n2)
        }
    }

    // 元素初始加载
    const mountElement = (
        vnode: VNode,
        container: RendererElement,
    ) => {
        const {
            shapeFlag,
            props
        } = vnode;

        // 1 创建外层
        let el: HostElement;
        el = vnode.el = hostCreateElement(vnode.type);

        // 2 文本或者子节点
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
            hostSetElementText(el, vnode.children as string)
        }else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
            mountChildren(vnode.children, el)
        }
 
        // 3 属性操作
        if(props){
            for(const key in props){
                hostPatchProp(
                    el,
                    key,
                    null,
                    props[key],
                )
            }
        }

        // 4 插入
        hostInsert(el, container)
    }

    // 加载数组类型子节点
    const mountChildren = (
        children: any,
        container: RendererElement,
        start = 0
    ) => {
        for (let i = start; i < children.length; i++) {
            const child = (children[i] = normalizeVNode(children[i]));
            patch(null, child, container)
        }
    }

    // 元素更新
    const patchElement = (
        n1: VNode,
        n2: VNode
    ) => {

    }

    // 组件渲染
    const processComponent: PatchFn = (n1, n2, container) => {
        if (n1 == null) {
            // 加载
            mountComponent( n2, container )
        } else {
            // 更新 instance update
            const instance = (n2.component = n1.component)!
            instance.next = n2
            instance.update()
        }
    }

    // 组件加载
    const mountComponent: ComponentFn = (initialVNode, container) => {
        // 创建实例
        const instance: ComponentInstance = (
            initialVNode.component = createComponentInstance(initialVNode)
        );

        // 初始化组件
        setupComponent(instance);

        //渲染组件
        setupRenderEffect(
            instance,
            container
        )
    }

    const setupRenderEffect: SetupRenderEffectFn = (
        instance,
        container
    ) => {
        // 等待更新时使用
        instance.update = effect(() => {
            if(!instance.isMounted){
                // 初始加载
                const subTree = (instance.subTree = renderComponentRoot(instance))
                patch(null, subTree, container);
                instance.isMounted = true;
            }else{
                // 数据更新 前后树对比 继续patch
                const nextTree = renderComponentRoot(instance);
                const prevTree = instance.subTree;
                // 更换
                instance.subTree = nextTree;
                patch(prevTree, nextTree, prevTree.el!);
            }
        },{
            scheduler: () => {}
        })
    }

    const render: RootRenderFunction = (vnode, container)=>{
        patch(null, vnode, container)
    }

    return {
        createApp: createAppAPI(render)
    }
}

function createAppAPI<HostElement>(
    render: RootRenderFunction
){
    return function createApp(root: string){

        const app = {
            mount(container: HostElement){
                // 第一步创建vnode
                let vnode = createVnode(root);
                // 第二步 执行渲染
                render(vnode, container);
            }
        }
        return app;
    }
}

const h = (type: any, props?: any, children?: any): VNode => createVnode(type, props, children);

export {
    createRenderer,
    h
}