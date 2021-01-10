import {
    VNode,
    ReactiveFlags,
    ShapeFlags,
    VNodeNormalizedChildren
} from '../shared/svu';

import {
    isString,
    isObject,
    isFunction,
    isArray
} from '../shared';

/**
 * 创建 vnode
 */
const createVnode = (
    type: string,
    props?: any,
    children: unknown = null,
    patchFlag: number = 0,
    dynamicProps: string[] | null = null,
): VNode => {
    const shapeFlag = isString(type)
        ? ShapeFlags.ELEMENT
            : isObject(type)
                ? ShapeFlags.STATEFUL_COMPONENT
                    : isFunction(type)
                        ? ShapeFlags.FUNCTIONAL_COMPONENT
                            : 0
    const vnode: VNode = {
        [ReactiveFlags.SKIP]: true,
        type,
        props,
        key: props && props.key,
        children: null,
        component: null,

        el: null,
        target: null,
        
        shapeFlag, // vnode 类型
        patchFlag, // 编译时生成的flag
        dynamicProps, // 动态属性在编译阶段被收集到dynamicProps中，运行时做diff操作时会只对比动态属性的变化
        dynamicChildren: null, // 用来存储一个节点下所有子代动态节点的数组
    }

    // 处理子节点
    normalizeChildren(vnode, children);
    
    return vnode;
}

function normalizeChildren(vnode: VNode, children: unknown){
    let type: number = 0;
    if (isArray(children)) { 
        type |= ShapeFlags.ARRAY_CHILDREN // 16 
    } else if (isString(children)) {
        type |= ShapeFlags.TEXT_CHILDREN // 8
    } else if (isFunction(children)) {
        children = { default: children }
        type = ShapeFlags.SLOTS_CHILDREN
    }
    vnode.shapeFlag |= type;
    vnode.children = children as VNodeNormalizedChildren;
}

export {
    createVnode
}