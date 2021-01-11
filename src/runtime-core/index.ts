import {
    RootRenderFunction,
    VNode,
    PatchFn,
    ShapeFlags,
    ComponentFn,
    ComponentInstance,
    SetupRenderEffectFn
} from '../shared/svu';

import {
    createVnode
} from './vnode';

import {
    createComponentInstance,
    setupComponent
} from './component';

import {
    renderComponentRoot
} from './componentRenderUtils'

import { effect } from '../reactivity'

const createRenderer = (options?: object) => {

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
        } else {
          // 更新
        }
    }

    // 组件渲染
    const processComponent: PatchFn = (n1, n2, container) => {
        if (n1 == null) {
            // 加载
            mountComponent( n2, container )
        } else {
            // 更新
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
            initialVNode,
            container
        )
    }

    const setupRenderEffect: SetupRenderEffectFn = (
        instance,
        initialVNode,
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
                // 数据更新 diff
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