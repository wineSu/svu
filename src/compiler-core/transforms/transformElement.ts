import {
    createObjectExpression,
    ConstantTypes,
    createVNodeCall
} from '../ast'

import {
    NodeTypes,
    PatchFlags
} from '../../shared/svu';

import {
    isStaticExp
} from '../../shared';

import { getConstantType } from './hoistStatic'

// generate a JavaScript AST for this element's codegen
export const transformElement = (node: any, context: any) => {
    if (!(node.type === NodeTypes.ELEMENT)) {
        return;
    }
    return function postTransformElement() {
        const { tag, props } = node
        const vnodeTag = `"${tag}"`;
        let vnodeProps
        let vnodeChildren
        let vnodePatchFlag
        let patchFlag: number = 0
        let vnodeDynamicProps
        let dynamicPropNames: string[] | undefined
        let shouldUseBlock;
        // props
        if (props.length > 0) {
            const propsBuildResult = buildProps(node, context)
            vnodeProps = propsBuildResult.props
            patchFlag = propsBuildResult.patchFlag
            dynamicPropNames = propsBuildResult.dynamicPropNames
        }
        // children
        if (node.children.length > 0) {

            if (node.children.length === 1) {
                const child = node.children[0]
                const type = child.type
                // check for dynamic text children
                const hasDynamicTextChild =
                    type === NodeTypes.INTERPOLATION ||
                    type === NodeTypes.COMPOUND_EXPRESSION
                if (
                    hasDynamicTextChild &&
                    getConstantType(child, context) === ConstantTypes.NOT_CONSTANT
                ) {
                    patchFlag |= PatchFlags.TEXT
                }
                // pass directly if the only child is a text node
                // (plain / interpolation / expression)
                if (hasDynamicTextChild || type === NodeTypes.TEXT) {
                    vnodeChildren = child
                } else {
                    vnodeChildren = node.children
                }
            } else {
                vnodeChildren = node.children
            }
        }

        // patchFlag & dynamicPropNames
        if (patchFlag !== 0) {
            vnodePatchFlag = String(patchFlag)
            if (dynamicPropNames && dynamicPropNames.length) {
                vnodeDynamicProps = stringifyDynamicPropNames(dynamicPropNames)
            }
        }

        node.codegenNode = createVNodeCall(
            context,
            vnodeTag,
            vnodeProps,
            vnodeChildren,
            vnodePatchFlag,
            vnodeDynamicProps,
            !!shouldUseBlock,
            false /* disableTracking */,
            node.loc
        )
    }
}

export function buildProps(
    node: any,
    context: any,
    props = node.props,
){
    const { loc: elementLoc } = node
    let properties = []

    // patchFlag analysis
    let patchFlag = 0
    let hasClassBinding = false
    let hasHydrationEventBinding = false
    const dynamicPropNames: string[] = []

    const analyzePatchFlag = ({ key }: any) => {
        if (isStaticExp(key)) {
            const name = key.content
            if (name === 'class') {
                hasClassBinding = true
            } else if (name !== 'key' && !dynamicPropNames.includes(name)) {
                dynamicPropNames.push(name)
            }
        }
    }

    for (let i = 0; i < props.length; i++) {
        // static attribute
        const prop = props[i]
        const { name } = prop
        // 指令解析
        const directiveTransform = context.directiveTransforms[name]
        if (directiveTransform) {
            // has built-in directive transform.
            const { props } = directiveTransform(prop, node, context)
            props.forEach(analyzePatchFlag)
            properties.push(...props)
        }
    }

    let propsExpression = undefined

   if (properties.length) {
        propsExpression = createObjectExpression(
            properties,
            elementLoc
        )
    }

    if (hasClassBinding) {
        patchFlag |= PatchFlags.CLASS
    }
    if (dynamicPropNames.length) {
        patchFlag |= PatchFlags.PROPS
    }
    if (hasHydrationEventBinding) {
        patchFlag |= PatchFlags.HYDRATE_EVENTS
    }

    return {
        props: propsExpression,
        patchFlag,
        dynamicPropNames
    }
}

function stringifyDynamicPropNames(props: string[]): string {
    let propsNamesString = `[`
    for (let i = 0, l = props.length; i < l; i++) {
        propsNamesString += JSON.stringify(props[i])
        if (i < l - 1) propsNamesString += ', '
    }
    return propsNamesString + `]`
}
