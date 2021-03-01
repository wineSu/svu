import {
    ConstantTypes,
} from '../ast'
import {
    NodeTypes,
    PatchFlags,
} from '../../shared/svu';
import {
    isString
} from '../../shared';

export function hoistStatic(root: any, context: any) {
    walk(root, context, true)
}

function walk(
    node: any,
    context: any,
    doNotHoistNode: boolean = false
) {
    let hasHoistedNode = false;
    let canStringify = true;

    const { children } = node
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        // only plain elements & text calls are eligible for hoisting.
        if (child.type === NodeTypes.ELEMENT) {
            const constantType = doNotHoistNode
                ? ConstantTypes.NOT_CONSTANT
                : getConstantType(child, context)
            if (constantType > ConstantTypes.NOT_CONSTANT) {
                if (constantType < ConstantTypes.CAN_STRINGIFY) {
                    canStringify = false
                }
                if (constantType >= ConstantTypes.CAN_HOIST) {
                    ; (child.codegenNode).patchFlag = PatchFlags.HOISTED;
                    child.codegenNode = context.hoist(child.codegenNode!)
                    hasHoistedNode = true
                    continue
                }
            } else {
                // node may contain dynamic children, but its props may be eligible for
                // hoisting.
                const codegenNode = child.codegenNode!
                if (codegenNode.type === NodeTypes.VNODE_CALL) {
                    const flag = getPatchFlag(codegenNode)
                    if (
                        (!flag ||
                            flag === PatchFlags.NEED_PATCH ||
                            flag === PatchFlags.TEXT) &&
                        getGeneratedPropsConstantType(child, context) >=
                        ConstantTypes.CAN_HOIST
                    ) {
                        const props = getNodeProps(child)
                        if (props) {
                            codegenNode.props = context.hoist(props)
                        }
                    }
                }
            }
        }

        // walk further
        if (child.type === NodeTypes.ELEMENT) {
            walk(child, context)
        } else if (child.type === NodeTypes.IF) {
            for (let i = 0; i < child.branches.length; i++) {
                // Do not hoist v-if single child because it has to be a block
                walk(
                    child.branches[i],
                    context,
                    child.branches[i].children.length === 1
                )
            }
        }
    }
}

export function getConstantType(
    node: any,
    context: any
): ConstantTypes {
    const { constantCache } = context
    switch (node.type) {
        case NodeTypes.ELEMENT:
            
            const codegenNode = node.codegenNode!
            
            const flag = getPatchFlag(codegenNode)
            if (!flag) {
                let returnType = ConstantTypes.CAN_STRINGIFY
            
                return returnType
            } else {
                constantCache.set(node, ConstantTypes.NOT_CONSTANT)
                return ConstantTypes.NOT_CONSTANT
            }
        case NodeTypes.TEXT:
            return ConstantTypes.CAN_STRINGIFY
        case NodeTypes.IF:
        case NodeTypes.IF_BRANCH:
            return ConstantTypes.NOT_CONSTANT
        case NodeTypes.TEXT_CALL:
            return getConstantType(node.content, context)
        case NodeTypes.SIMPLE_EXPRESSION:
            return node.constType
        case NodeTypes.COMPOUND_EXPRESSION:
            let returnType = ConstantTypes.CAN_STRINGIFY
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i]
                if (isString(child)) {
                    continue
                }
                const childType = getConstantType(child, context)
                if (childType === ConstantTypes.NOT_CONSTANT) {
                    return ConstantTypes.NOT_CONSTANT
                } else if (childType < returnType) {
                    returnType = childType
                }
            }
            return returnType
        default:
            return ConstantTypes.NOT_CONSTANT
    }
}

function getGeneratedPropsConstantType(
    node: any,
    context: any
): ConstantTypes {
    let returnType = ConstantTypes.CAN_STRINGIFY
    const props = getNodeProps(node)
    if (props && props.type === NodeTypes.JS_OBJECT_EXPRESSION) {
        const { properties } = props
        for (let i = 0; i < properties.length; i++) {
            const { key, value } = properties[i]
            const keyType = getConstantType(key, context)
            if (keyType === ConstantTypes.NOT_CONSTANT) {
                return keyType
            }
            if (keyType < returnType) {
                returnType = keyType
            }
            if (value.type !== NodeTypes.SIMPLE_EXPRESSION) {
                return ConstantTypes.NOT_CONSTANT
            }
            const valueType = getConstantType(value, context)
            if (valueType === ConstantTypes.NOT_CONSTANT) {
                return valueType
            }
            if (valueType < returnType) {
                returnType = valueType
            }
        }
    }
    return returnType
}

function getNodeProps(node: any) {
    const codegenNode = node.codegenNode!
    if (codegenNode.type === NodeTypes.VNODE_CALL) {
        return codegenNode.props
    }
}

function getPatchFlag(node: any): number | undefined {
    const flag = node.patchFlag
    return flag ? parseInt(flag, 10) : undefined
}
