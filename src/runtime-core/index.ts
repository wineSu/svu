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
    RendererNode,
    PatchFlags,
    Data,
    VNodeArrayChildren
} from '../shared/svu';

import {
    EMPTY_OBJ,
    isSameVNodeType
} from '../shared'

import {
    createVnode,
    Text,
    Fragment
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

// TODO 元素更新diff  调度异步批量更新  生命周期 编译
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
        setText: hostSetText,
        setElementText: hostSetElementText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
        setScopeId: hostSetScopeId = () => {},
        cloneNode: hostCloneNode,
    } = options;

    // 不同类型分发处理
    const patch: PatchFn = (n1, n2, container) => {
        let { shapeFlag, type } = n2;
        // 某节点中是一个 [string, string]
        switch(type){
            case Text:
                processText(n1, n2, container)
            break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container)
                } else if (shapeFlag & ShapeFlags.COMPONENT) {
                    processComponent(n1, n2, container)
                }
            break;
        }
    }

    const processText: PatchFn = (n1, n2, container) => {
        if (n1 == null) {
            hostInsert(
                n2.el = hostCreateText(n2.children as string),
                container
            )
        } else {
            const el = (n2.el = n1.el!);
            if (n2.children !== n1.children) {
                hostSetText(el, n2.children as string)
            }
        }
    }

    // 节点渲染[初始|更新]
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

        // 2 单文本<p>1</p >或者 子节点[]
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
        const el = (n2.el = n1.el!);
        // 编译时生成的 patchFlag
        let {patchFlag, dynamicChildren} = n2;

        // patchFlag 和 n1.patchFlag 相同则使用相同的flag 否则取 full
        patchFlag |= n1.patchFlag & PatchFlags.FULL_PROPS;

        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        
        // 属性对比过程中的优化体现在：
        // 动态节点的全量对比 | class | style | 其他动态属性 | 纯文本的处理 
        // 不符合以上条件的同样是全量diff属性
        if(patchFlag > 0){
            // 动态属性 
            if(patchFlag & PatchFlags.FULL_PROPS){
                patchProps(el, n2, oldProps, newProps)
            } else {
                // 动态 class
                if(patchFlag & PatchFlags.CLASS){
                    if(oldProps.class != newProps.class){
                        hostPatchProp(el, 'class', null, newProps.class)
                    }
                }
                // 动态 style
                if(patchFlag & PatchFlags.STYLE){
                    hostPatchProp(el, 'style', oldProps.style, newProps.style);
                }
                // 动态其他属性 :s = "aa"
                if(patchFlag & PatchFlags.PROPS){
                    const propsToUpdate = n2.dynamicProps!;
                    for (let i = 0, len = propsToUpdate.length; i < len; i++) {
                        const key = propsToUpdate[i];
                        const prev = oldProps[key];
                        const next = newProps[key];
                        if (next !== prev) {
                            hostPatchProp(el, key, prev, next)
                        }
                    }
                }
            }
            // 纯文本属性的替换 s = '1'
            if(patchFlag & PatchFlags.TEXT){
                if (n1.children !== n2.children) {
                    hostSetElementText(el, n2.children as string)
                }
            }
        }else{
            patchProps(el, n2, oldProps, newProps)
        }

        // 子元素 diff 数组
        if(dynamicChildren){
            patchBlockChildren(n1.dynamicChildren!, dynamicChildren, el);
        }else{
            patchChildren(n1, n2, el);
        }
    }
    
    const patchProps = (
        el: RendererElement,
        vnode: VNode,
        oldProps: Data,
        newProps: Data,
    ) => {
        if(oldProps !== newProps){
            // 前后属性不相等
            for(let key in newProps){
                const next = newProps[key];
                const prev = oldProps[key];
                if(next !== prev){
                    hostPatchProp(el, key, prev, next);
                }
            }
            // 老的有新的没有
            for(const key in oldProps){ 
                if(!(key in newProps)){
                    hostPatchProp(el, key, oldProps[key], null);
                }
            }
        }
    }

    const patchBlockChildren = (
        oldChildren: VNode[],
        newChildren: VNode[],
        fallbackContainer: RendererElement,
    ) => {
        for (let i = 0, len = newChildren.length; i < len; i++) {
            const oldVNode = oldChildren[i]
            const newVNode = newChildren[i]
            const container =
              // Fragment
              oldVNode.type === Fragment ||
              // 不同类型节点替换 需要找到父节点
              !isSameVNodeType(oldVNode, newVNode) ||
              // - In the case of a component, it could contain anything.
              oldVNode.shapeFlag & ShapeFlags.COMPONENT
                ? hostParentNode(oldVNode.el!)! : fallbackContainer;

            patch(oldVNode, newVNode, container)
        }
    }

    const patchChildren = (
        n1: VNode | null,
        n2: VNode,
        container: RendererElement,
    ) => {
        const c1 = n1 && n1.children;
        const prevShapeFlag = n1 ? n1.shapeFlag : 0;
        const c2 = n2.children;

        const { patchFlag, shapeFlag } = n2
        // 1 new: text  old: array
        // 2 new: text  old: text | null
        // 3 new: array old: array +++++++++
        // 4 new: null  old: array
        // 5 new: null  old: text | null
        // 6 new: array old: text | null
        // 按照上述思路进行 diff
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
            if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
                // 卸载组件 TODO
                container.innerHTML = '';
            }
            if(c2 !== c1){
                hostSetElementText(container, c2 as string)
            }
        } else {
            if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
                if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
                    // array 前后对比
                    patchKeyedChildren(c1 as VNode[], c2 as VNodeArrayChildren, container);
                }else{
                    // 卸载组件 TODO
                    container.innerHTML = '';
                }
            } else {
                if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN){
                    hostSetElementText(container, '');
                }
                if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
                    // 加载数组类型组件
                    mountChildren( c2, container)
                }
            }
        }
    }

    // array 子元素对比
    const patchKeyedChildren =  (
        c1: VNode[],
        c2: VNodeArrayChildren,
        container: RendererElement,
    ) => {
        let i = 0, l2 = c2.length,
            e1 = c1.length - 1,
            e2 = l2 - 1;
        
        // (a b) c
        // (a b) d e
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i] = normalizeVNode(c2[i]);
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container);
            } else {
                break;
            }
            i++;
        }

        // a (b c)
        // d e (b c)
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2] = normalizeVNode(c2[e2]);
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container);
            } else {
                break;
            }
            e1--;
            e2--;
        }

        // (a b)
        // (a b) c
        // i = 2, e1 = 1, e2 = 2
        // (a b)
        // c (a b)
        // i = 0, e1 = -1, e2 = 0
        if (i > e1) {
            while (i <= e2) {
                patch(null, c2[i] = normalizeVNode(c2[i]), container)
                i++;
            }
        }
        // (a b) c
        // (a b)
        // i = 2, e1 = 2, e2 = 1
        // a (b c)
        // (b c)
        // i = 0, e1 = 0, e2 = -1
        else if(i < e2){
            while (i <= e1) {
                hostRemove(c1[i].el as any);
                i++;
            }
        }
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
        }, {
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