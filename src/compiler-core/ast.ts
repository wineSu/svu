import {
    NodeTypes,
    CallExpression,
    ConditionalExpression
} from '../shared/svu';

import {
    isString
} from '../shared'

export const locStub = {
    source: '',
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 1, offset: 0 }
}

export const enum ConstantTypes {
    NOT_CONSTANT = 0,
    CAN_SKIP_PATCH,
    CAN_HOIST,
    CAN_STRINGIFY
}

export function createRoot(
    children: any,
    loc = locStub
) {
    return {
        type: NodeTypes.ROOT,
        children,
        helpers: [],
        components: [],
        directives: [],
        hoists: [],
        imports: [],
        cached: 0,
        temps: 0,
        codegenNode: undefined,
        loc
    }
}

export function createConditionalExpression(
    test: ConditionalExpression['test'],
    consequent: ConditionalExpression['consequent'],
    alternate: ConditionalExpression['alternate'],
    newline = true
): ConditionalExpression {
    return {
        type: NodeTypes.JS_CONDITIONAL_EXPRESSION,
        test,
        consequent,
        alternate,
        newline,
        loc: locStub
    }
}

export function createCallExpression<T extends CallExpression['callee']>(
    callee: T,
    args: any,
){
    return {
      type: NodeTypes.JS_CALL_EXPRESSION,
      loc: locStub,
      callee,
      arguments: args
    } as any
}


export function createSimpleExpression(
    content: any,
    isStatic: any,
    loc = locStub,
    constType = ConstantTypes.NOT_CONSTANT
) {
    return {
      type: NodeTypes.SIMPLE_EXPRESSION,
      loc,
      content,
      isStatic,
      constType: isStatic ? ConstantTypes.CAN_STRINGIFY : constType
    } as any
}

export function createObjectProperty(
    key: any,
    value: any
) {
    return {
      type: NodeTypes.JS_PROPERTY,
      loc: locStub,
      key: isString(key) ? createSimpleExpression(key, true) : key,
      value
    }
}

export function createObjectExpression(
    properties: any,
    loc = locStub
  ) {
    return {
      type: NodeTypes.JS_OBJECT_EXPRESSION,
      loc,
      properties
    }
}

export function createVNodeCall(
    context: any,
    tag: any,
    props?: any,
    children?: any,
    patchFlag?: any,
    dynamicProps?: any,
    directives?: any,
    isBlock = false,
    disableTracking = false,
    loc = locStub
  ) {
    if (context) {
      if (isBlock) {
        context.helper('OPEN_BLOCK')
        context.helper('CREATE_BLOCK')
      } else {
        context.helper('CREATE_VNODE')
      }
      if (directives) {
        context.helper('WITH_DIRECTIVES')
      }
    }
  
    return {
      type: NodeTypes.VNODE_CALL,
      tag,
      props,
      children,
      patchFlag,
      dynamicProps,
      directives,
      isBlock,
      disableTracking,
      loc
    }
  }