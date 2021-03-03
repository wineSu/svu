import {
    createSimpleExpression,
    ConstantTypes
} from './ast';
import {
    isString,
    isArray
} from '../shared';
import {
    hoistStatic
} from './transforms/hoistStatic';
import {
    NodeTypes
} from '../shared/svu';

import { transformIf } from './transforms/vIf'
import { transformElement } from './transforms/transformElement'
import { transformOn } from './transforms/vOn'
import { transformText } from './transforms/transformText'

// context 转换ast工具和信息集
export function createTransformContext() {
    const context: any = {
        hoists: [],
        helpers: new Set(),
        helper(name: any) {
            context.helpers.add(name)
            return name
        },
        replaceNode(node: any) {
            context.parent!.children[context.childIndex] = context.currentNode = node
        },
        removeNode(node: any) {
            const list = context.parent!.children
            const removalIndex = node
                ? list.indexOf(node)
                : context.currentNode
                    ? context.childIndex
                    : -1;
            if (!node || node === context.currentNode) {
                // current node removed
                context.currentNode = null
                context.onNodeRemoved()
            } else {
                // sibling node removed
                if (context.childIndex > removalIndex) {
                    context.childIndex--
                    context.onNodeRemoved()
                }
            }
            context.parent!.children.splice(removalIndex, 1)
        },
        hoist(exp: any) {
            context.hoists.push(exp)
            const identifier = createSimpleExpression(
                `_hoisted_${context.hoists.length}`,
                false,
                exp.loc,
                ConstantTypes.CAN_HOIST
            )
            identifier.hoisted = exp
            return identifier
        },
        nodeTransforms: [
            transformIf,
            transformElement,
            transformText
        ],
        directiveTransforms: {
            on: transformOn,
        }
    }
    return context
}

/**
 * 语法制导分析
 * traverseNode 顺序为后序遍历
 */
export function transform(root: any) {
    const context = createTransformContext()
    traverseNode(root, context)
    hoistStatic(root, context)
    // root.codegenNode挂载
    root.codegenNode = root.children[0]
    root.hoists = context.hoists
}

export function traverseNode(
    node: any,
    context: any
) {
    context.currentNode = node
    // apply transform plugins
    const { nodeTransforms } = context
    const exitFns = []
    for (let i = 0; i < nodeTransforms.length; i++) {
        const onExit = nodeTransforms[i](node, context)
        if (onExit) {
            if (isArray(onExit)) {
                exitFns.push(...onExit)
            } else {
                exitFns.push(onExit)
            }
        }
        if (!context.currentNode) {
            // node was removed
            return
        } else {
            // node may have been replaced
            node = context.currentNode
        }
    }
    switch (node.type) {
        case NodeTypes.IF:
            // 这里只对if的情况先处理，else等后面遍历到的时候，同样需要再次traverseNode
            for (let i = 0; i < node.branches.length; i++) {
                traverseNode(node.branches[i], context)
            }
            break
        case NodeTypes.IF_BRANCH:
        case NodeTypes.ELEMENT:
        case NodeTypes.ROOT:
            traverseChildren(node, context)
            break
    }
    // 后序  保证子节点完成信息转换  父节点再完成
    context.currentNode = node
    let i = exitFns.length
    while (i--) {
        exitFns[i]()
    }
}

export function traverseChildren(
    parent: ParentNode,
    context: any
) {
    let i = 0
    const nodeRemoved = () => {
        i--
    }
    for (; i < parent.children.length; i++) {
        const child = parent.children[i]
        if (isString(child)) continue
        // 方便ast的一些转换操作
        context.parent = parent
        context.childIndex = i
        context.onNodeRemoved = nodeRemoved
        traverseNode(child, context)
    }
}