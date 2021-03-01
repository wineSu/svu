import {
    createSimpleExpression,
    ConstantTypes
} from './ast';
import {
    isString,
    isArray
} from '../shared';
import {
    NodeTypes
} from '../shared/svu';

/**
 * transfrom顺序为后序遍历
 */

export function createTransformContext() {
    const context: any = {
        hoists: [],
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
    }
    return context
}

export function transform(root: any) {
    const context = createTransformContext()
    traverseNode(root, context)
    hoistStatic(root, context)
    root.hoists = context.hoists
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
        context.parent = parent
        context.childIndex = i
        context.onNodeRemoved = nodeRemoved
        traverseNode(child, context)
    }
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

    // exit transforms
    context.currentNode = node
    let i = exitFns.length
    while (i--) {
        exitFns[i]()
    }
}
