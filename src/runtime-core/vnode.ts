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

// 节点类型
export const Fragment = Symbol('Fragment');
export const Text = Symbol('Text')
export const Comment = Symbol('Comment')
export const Static = Symbol('Static')

// block start
/**
 * (openBlock(1),
      createBlock('div', null, [
        ((openBlock(2),
        createBlock("Frag", null, [
          222,
          333
        ])))
    ]))
    编译器会做--：
    一种树的遍历，先按照层级顺序执行openBlock，然后再是树的完成过程（叶子节点开始）
    openBlock1 --> openBlock2 --> Frag --> div
 */
export const blockStack: (VNode[] | null)[] = []
let currentBlock: VNode[] | null = null

export function openBlock() {
  blockStack.push((currentBlock = []))
}

export function closeBlock() {
  blockStack.pop()
  currentBlock = blockStack[blockStack.length - 1] || null
}

export function createBlock(
  type: string | symbol,
  props?: any,
  children?: any,
  patchFlag?: number,
  dynamicProps?: string[]
): VNode {
  const vnode = createVnode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
  )

  vnode.dynamicChildren = currentBlock || []

  closeBlock()

  if (currentBlock) {
    currentBlock.push(vnode)
  }
  return vnode
}
// block end


/**
 * 创建 vnode
 */
export const createVnode = (
    type: string | symbol,
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
                            : 0;
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
    // 增加block点的处理
    if ( currentBlock && patchFlag > 0) {
      currentBlock.push(vnode);
    }
    return vnode;
}

function normalizeChildren(vnode: VNode, children: unknown){
    let type = 0;
    if (isArray(children)) { 
        type = ShapeFlags.ARRAY_CHILDREN // 16 
    } else if (isFunction(children)) {
        children = { default: children }
        type = ShapeFlags.SLOTS_CHILDREN
    }else{
        children = String(children)
        type = ShapeFlags.TEXT_CHILDREN
    }
    vnode.children = children as VNodeNormalizedChildren;
    vnode.shapeFlag |= type;
}