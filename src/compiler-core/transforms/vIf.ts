import {
    StructuralDirectiveTransform,
    NodeTransform,
    NodeTypes
} from '../../shared/svu';

import {
    createConditionalExpression,
    createCallExpression,
} from '../ast';

import {
    traverseNode
} from '../transform';

function createStructuralDirectiveTransform(
    name: RegExp,
    fn: StructuralDirectiveTransform
): NodeTransform {
    const matches = (n: string) => name.test(n);

    return (node, context) => {
        if (node.type === NodeTypes.ELEMENT) {
            const { props } = node;
            const exitFns = [];

            for (let i = 0; i < props.length; i++) {
                const prop = props[i];
                if (prop.type === NodeTypes.DIRECTIVE && matches(prop.name)) {
                    props.splice(i, 1);
                    i--;
                    const onExit = fn(node, prop, context);
                    onExit && exitFns.push(onExit);
                }
            }
            return exitFns;
        }
    }
}

export const transformIf = createStructuralDirectiveTransform(
    /^(if|else|else-if)$/,
    (node, dir, context) => {
        return processIf(node, dir, context, (ifNode, branch, isRoot) => {
            return () => {
                if (isRoot) {
                    ifNode.codegenNode = createCodegenNodeForBranch(
                        branch,
                        context
                    )
                } else {
                    const parentCondition = getParentCondition(ifNode.codegenNode!)
                    parentCondition.alternate = createCodegenNodeForBranch(
                        branch,
                        context
                    )
                }
            }
        })
    }
)

export function processIf(
    node: any,
    dir: any,
    context: any,
    processCodegen?: (
        node: any,
        branch: any,
        isRoot: boolean
    ) => (() => void) | undefined
) {
    if (dir.name === 'if') {
        const branch = createIfBranch(node, dir)
        const ifNode = {
            type: NodeTypes.IF,
            loc: node.loc,
            branches: [branch]
        }
        context.replaceNode(ifNode)
        if (processCodegen) {
            return processCodegen(ifNode, branch, true)
        }
    } else {
        // locate the adjacent v-if
        const siblings = context.parent!.children
        let i = siblings.indexOf(node)
        while (i-- >= -1) {
            const sibling = siblings[i]

            if (sibling && sibling.type === NodeTypes.IF) {
                // move the node to the if node's branches
                context.removeNode()
                const branch = createIfBranch(node, dir)
               
                sibling.branches.push(branch)
                const onExit = processCodegen && processCodegen(sibling, branch, false)
                // since the branch was removed, it will not be traversed.
                // make sure to traverse here.
                traverseNode(branch, context)
                // call on exit
                if (onExit) onExit()
                // make sure to reset currentNode after traversal to indicate this
                // node has been removed.
                context.currentNode = null
            }
            break
        }
    }
}

function createIfBranch(node: any, dir: any) {
    return {
        type: NodeTypes.IF_BRANCH,
        loc: node.loc,
        condition: dir.name === 'else' ? undefined : dir.exp,
        children: [node],
    }
}

function createCodegenNodeForBranch(
    branch: any,
    context: any
){
    if (branch.condition) {
        return createConditionalExpression(
            branch.condition,
            createChildrenCodegenNode(branch, context),
            // make sure to pass in asBlock: true so that the comment node call
            // closes the current block.
            createCallExpression(context.helper('CREATE_COMMENT'), [
                '""',
                'true'
            ])
        )
    } else {
        return createChildrenCodegenNode(branch, context)
    }
}

function createChildrenCodegenNode(
    branch: any,
    context: any
) {
    const { helper } = context;
    const { children } = branch;
    const firstChild = children[0];

    const vnodeCall = firstChild.codegenNode;
    // Change createVNode to createBlock.
    if (vnodeCall.type === NodeTypes.VNODE_CALL) {
        vnodeCall.isBlock = true;
        helper('OPEN_BLOCK')
        helper('CREATE_BLOCK')
    }
    return vnodeCall
}

function getParentCondition(node: any) {
    while (true) {
        if (node.type === NodeTypes.JS_CONDITIONAL_EXPRESSION) {
            return node
        }
    }
}
