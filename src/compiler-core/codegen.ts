import {
    NodeTypes
} from '../shared/svu'

import { isString, isArray } from '../shared';

const PURE_ANNOTATION = `/*#__PURE__*/`;
const helperNameMap: any = {
    'OPEN_BLOCK': `openBlock`,
    'CREATE_BLOCK': `createBlock`,
    'CREATE_VNODE': `createVnode`,
    'CREATE_TEXT': `createTextVNode`,
    'CREATE_STATIC': `createStaticVNode`,
    'CREATE_COMMENT': 'createCommentVNode'
};

// code 生成一些工具集
function createCodegenContext(ast: any) {
    const context = {
        source: ast.loc.source,
        code: ``,
        line: 1,
        indentLevel: 0,
        pure: false,
        map: undefined,
        helper(key: string) {
            return `${helperNameMap[key]}`
        },
        push(code: any) {
            context.code += code
        },
        indent() {
            newline(++context.indentLevel)
        },
        deindent(withoutNewLine = false) {
            if (withoutNewLine) {
                --context.indentLevel
            } else {
                newline(--context.indentLevel)
            }
        },
        newline() {
            newline(context.indentLevel)
        }
    }
    let newline = (n: number) => {
        context.push('\n' + `  `.repeat(n))
    }

    return context
}

export function generate(ast: any) {
    const context = createCodegenContext(ast)
    const {
        push,
        indent,
        deindent,
    } = context;

    const preambleContext = context

    // 初始化的代码生成
    genFunctionPreamble(ast, preambleContext)

    // ctx就是组件中返回的对象
    push(`function render(_ctx) {`)
    indent()
    push(`with (_ctx) {`)
    indent()
    push(`return `);

    if (ast.codegenNode) {
        genNode(ast.codegenNode, context)
    }

    deindent()
    push(`}`)

    deindent()
    push(`}`)

    return {
        ast,
        code: context.code,
        preamble: ``,
    }
}

function genFunctionPreamble(ast: any, context: any) {
    const { push, newline } = context
    push(`const _Vue = Vue\n`)
    push(`const { createVnode, openBlock, createBlock } = _Vue\n`)
    genHoists(ast.hoists, context)
    newline()
    push(`return `)
}

function genHoists(hoists: any, context: any) {
    if (!hoists.length) {
        return
    }
    context.pure = true
    const { push, newline } = context
    newline()
    hoists.forEach((exp: string, i: number) => {
        if (exp) {
            push(`const _hoisted_${i + 1} = `)
            genNode(exp, context)
            newline()
        }
    })
    context.pure = false
}

function genNodeListAsArray(
    nodes: any,
    context: any
) {
    const multilines = nodes.length > 3
    context.push(`[`)
    multilines && context.indent()
    genNodeList(nodes, context, multilines)
    multilines && context.deindent()
    context.push(`]`)
}

function genNodeList(
    nodes: any,
    context: any,
    multilines: boolean = false,
    comma: boolean = true
) {
    const { push, newline } = context
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        
        if (isString(node)) {
            push(node)
        } else if (isArray(node)) {
            console.log(node, 111111)
            genNodeListAsArray(node, context)
        } else {
            genNode(node, context)
        }
        if (i < nodes.length - 1) {
            if (multilines) {
                comma && push(',')
                newline()
            } else {
                comma && push(', ')
            }
        }
    }
}

function genNode(node: any, context: any) {
    if (isString(node)) {
        context.push(node)
        return
    }
    switch (node.type) {
        case NodeTypes.ELEMENT:
        case NodeTypes.IF:
            genNode(node.codegenNode!, context)
            break
        case NodeTypes.TEXT:
            genText(node, context)
            break
        case NodeTypes.SIMPLE_EXPRESSION:
            genExpression(node, context)
            break
        case NodeTypes.INTERPOLATION:
            genInterpolation(node, context)
            break
        case NodeTypes.TEXT_CALL:
            genNode(node.codegenNode, context)
            break
        case NodeTypes.COMPOUND_EXPRESSION:
            genCompoundExpression(node, context)
            break
        case NodeTypes.VNODE_CALL:
            genVNodeCall(node, context)
            break

        case NodeTypes.JS_OBJECT_EXPRESSION:
            genObjectExpression(node, context)
            break
        case NodeTypes.JS_CONDITIONAL_EXPRESSION:
            genConditionalExpression(node, context)
            break

        /* istanbul ignore next */
        case NodeTypes.IF_BRANCH:
            // noop
            break
        default:
            break;
    }
}

function genText(
    node: any,
    context: any
) {
    context.push(JSON.stringify(node.content), node)
}

function genExpression(node: any, context: any) {
    const { content, isStatic } = node
    context.push(isStatic ? JSON.stringify(content) : content, node)
}

function genInterpolation(node: any, context: any) {
    const { push, pure } = context
    if (pure) push(PURE_ANNOTATION)
    genNode(node.content, context)
}

function genCompoundExpression(
    node: any,
    context: any
) {
    for (let i = 0; i < node.children!.length; i++) {
        const child = node.children![i]
        if (isString(child)) {
            context.push(child)
        } else {
            genNode(child, context)
        }
    }
}
const nonIdentifierRE = /^\d|[^\$\w]/;
const isSimpleIdentifier = (name: any) => !nonIdentifierRE.test(name);
function genExpressionAsPropertyKey(
    node: any,
    context: any
) {
    const { push } = context
    if (node.type === NodeTypes.COMPOUND_EXPRESSION) {
        push(`[`)
        genCompoundExpression(node, context)
        push(`]`)
    } else if (node.isStatic) {
        // only quote keys if necessary
        const text = isSimpleIdentifier(node.content)
            ? node.content
            : JSON.stringify(node.content)
        push(text, node)
    } else {
        push(`[${node.content}]`, node)
    }
}

function genVNodeCall(node: any, context: any) {
    const { push, helper } = context
    const {
        tag,
        props,
        children,
        patchFlag,
        dynamicProps,
        isBlock,
    } = node
    
    if (isBlock) {
        push(`(${helper('OPEN_BLOCK')}(), `)
    }
    
    push(helper(isBlock ? 'CREATE_BLOCK' : 'CREATE_VNODE') + `(`, node)
    genNodeList(
        genNullableArgs([tag, props, children, patchFlag, dynamicProps]),
        context
    )
    push(`)`)
    if (isBlock) {
        push(`)`)
    }
}

function genNullableArgs(args: any[]) {
    let i = args.length
    while (i--) {
        if (args[i] != null) break
    }
    return args.slice(0, i + 1).map(arg => arg || `null`)
}

function genObjectExpression(node: any, context: any) {
    const { push, indent, deindent, newline } = context
    const { properties } = node
    if (!properties.length) {
        push(`{}`, node)
        return
    }
    const multilines = properties.length > 1
    push(multilines ? `{` : `{ `)
    multilines && indent()
    for (let i = 0; i < properties.length; i++) {
        const { key, value } = properties[i]
        // key
        genExpressionAsPropertyKey(key, context)
        push(`: `)
        // value
        genNode(value, context)
        if (i < properties.length - 1) {
            // will only reach this if it's multilines
            push(`,`)
            newline()
        }
    }
    multilines && deindent()
    push(multilines ? `}` : ` }`)
}

function genConditionalExpression(
    node: any,
    context: any
) {
    debugger
    const { test, consequent, alternate, newline: needNewline } = node
    const { push, indent, deindent, newline } = context
    if (test.type === NodeTypes.SIMPLE_EXPRESSION) {
        const needsParens = !isSimpleIdentifier(test.content)
        needsParens && push(`(`)
        genExpression(test, context)
        needsParens && push(`)`)
    } else {
        push(`(`)
        genNode(test, context)
        push(`)`)
    }
    needNewline && indent()
    context.indentLevel++
    needNewline || push(` `)
    push(`? `)
    genNode(consequent, context)
    context.indentLevel--
    needNewline && newline()
    needNewline || push(` `)
    push(`: `)
    const isNested = alternate.type === NodeTypes.JS_CONDITIONAL_EXPRESSION
    if (!isNested) {
        context.indentLevel++
    }
    genNode(alternate, context)
    if (!isNested) {
        context.indentLevel--
    }
    needNewline && deindent(true /* without newline */)
}
