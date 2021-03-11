import {
    ParserContext,
    Position,
    Namespaces,
    NodeTypes,
    AttributeNode
} from '../shared/svu'

import {
    NO,
    isArray,
    extend
} from '../shared'

import {
    createRoot
} from './ast'

const enum TagType {
    Start,
    End
}

const tagRe = /^<\/?([a-z][^\t\r\n\f />]*)/i;
const tagSpaceRe = /^[\t\r\n\f ]+/;
const quoteRe = /^[\t\r\n\f ]*=/;
const attrRe = /^[^\t\r\n\f />][^\t\r\n\f />=]*/;
const bindRe = /^(v-|:|@|#)/;
const bindNameRe = /(?:^v-([a-z0-9-]+))?(?:(?::|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i;

const decodeRE = /&(gt|lt|amp|apos|quot);/g;
const decodeMap: Record<string, string> = {
    gt: '>',
    lt: '<',
    amp: '&',
    apos: "'",
    quot: '"'
};
export const defaultParserOptions = {
    delimiters: [`{{`, `}}`],
    getNamespace: () => Namespaces.HTML,
    isVoidTag: NO,
    isPreTag: NO,
    isCustomElement: NO,
    decodeEntities: (rawText: string): string =>
      rawText.replace(decodeRE, (_, p1) => decodeMap[p1]),
    comments: false
}

export function baseParse(content: string){
    const context = {
        options: defaultParserOptions,
        column: 1,
        line: 1,
        offset: 0,
        originalSource: content,
        source: content,
    }
    const start = getCursor(context);
    return createRoot(
        parseChildren(context, []),
        getSelection(context, start)
    )
}

function getCursor(context: ParserContext): Position {
    const { column, line, offset } = context
    return { column, line, offset }
}

function getSelection(
    context: ParserContext,
    start: Position,
    end?: Position
){
    end = end || getCursor(context)
    let source = context.originalSource.slice(start.offset, end.offset);
    return {
        start,
        end,
        source
    }
}

/**
 * 1、整体结构解析 parseText
 * 2、细分结构 parseElement
 * 3、处理数据 parseInterpolation
 */
function parseChildren(
    context: ParserContext,
    ancestors: any
) {
    const nodes = [];
    
    while (!isEnd(context, ancestors)) {
        const s = context.source
        let node = undefined;
        
        if (startsWith(s, context.options.delimiters[0])) {
            // '{{'
            node = parseInterpolation(context)
        } else if (/[a-z]/i.test(s[1])) {
            node = parseElement(context, ancestors)
        }
        if (!node) {
            node = parseText(context)
        }
    
        if (isArray(node)) {
            for (let i = 0, len = node.length; i < len; i++) {
                nodes.push(node[i])
            }
        } else {
            nodes.push(node);
        }
    }
    // content为空的优化去除
    for(let i = 0, len = nodes.length; i < len; i++){
        if (!/[^\t\r\n\f ]/.test(nodes[i].content)) {
            nodes[i] = null;
        }
    }
    return nodes.filter(Boolean);
}

// {{aaa}}
function parseInterpolation(context: ParserContext) {
    const [open, close] = context.options.delimiters;
  
    const closeIndex = context.source.indexOf(close, open.length);
  
    const start = getCursor(context);
    advanceBy(context, open.length);
    const innerStart = getCursor(context);
    const innerEnd = getCursor(context);
    const rawContentLength = closeIndex - open.length;
    const rawContent = context.source.slice(0, rawContentLength);
    const preTrimContent = parseTextData(context, rawContentLength);
    const content = preTrimContent.trim();
    const startOffset = preTrimContent.indexOf(content);
    // "{{ state.count }}"
    if (startOffset > 0) {
        advancePositionWithMutation(innerStart, rawContent, startOffset)
    }
    const endOffset = rawContentLength - (preTrimContent.length - content.length - startOffset);
    advancePositionWithMutation(innerEnd, rawContent, endOffset)
    advanceBy(context, close.length)
  
    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            isStatic: false,
            content,
            loc: getSelection(context, innerStart, innerEnd)
        },
        loc: getSelection(context, start)
    }
}

// 递归 后序遍历
function parseElement(context: ParserContext, ancestors: Element[]): any {
    // 拿出
    const element = parseTag(context, TagType.Start);
    
    // children
    ancestors.push(element);
    const children = parseChildren(context, ancestors);
    ancestors.pop();

    element.children = children;
    // 消除后半段标签
    if(startsWithEndTagOpen(context.source, element.tag)){
        parseTag(context, TagType.End);
    }
    
    // 消除后半个标签 需要重新计算source
    element.loc = getSelection(context, element.loc.start);
    return element;
}

function parseTag(context: ParserContext, type: TagType): any {
    const start = getCursor(context);
    const [tagStart, tag] = tagRe.exec(context.source)!;
    
    // 位置计算
    advanceBy(context, tagStart.length);
    advanceSpace(context); // tag 空格 <div v-if=...>

    let props = parseAttributes(context, type);

    if(context.source.length){
        // <div> >
        advanceBy(context, 1);
    }

    return{
        type: NodeTypes.ELEMENT,
        tag,
        props,
        loc: getSelection(context, start)
    }
}

// 属性解析
function parseAttributes(context: ParserContext, type: TagType): AttributeNode[] {
    const props: AttributeNode[] = [];
    const attrNames = new Set();
    while(
        context.source.length > 0 &&
        !startsWith(context.source, '>') && 
        !startsWith(context.source, '/>')
    ){
        // 解析 attr
        if(type === TagType.Start){

            const start = getCursor(context);
            const [name] = attrRe.exec(context.source)!;
            attrNames.add(name);
            advanceBy(context, name.length);
            let value = undefined;

            if (quoteRe.test(context.source)) {
                advanceSpace(context)
                advanceBy(context, 1)
                advanceSpace(context)
                value = parseAttributeValue(context)
            }
            const loc = getSelection(context, start);

            if (bindRe.test(name)) {
                const match = bindNameRe.exec(name)!;
                const dirName = match[1] || (startsWith(name, ':') ? 'bind' : startsWith(name, '@') ? 'on' : 'slot');
                let arg;
                if (match[2]) {
                    const startOffset = name.indexOf(match[2])
                    const loc = getSelection(
                        context,
                        getNewPosition(context, start, startOffset),
                        getNewPosition(context, start, startOffset + match[2].length)
                    )
                    let content = match[2];
                    let isStatic = true
                    arg = {
                        type: NodeTypes.SIMPLE_EXPRESSION,
                        content,
                        isStatic,
                        loc
                    }
                }

                if (value && value.isQuoted) {
                    const valueLoc = value.loc
                    valueLoc.start.offset++
                    valueLoc.start.column++
                    valueLoc.end = advancePositionWithClone(valueLoc.start, value.content)
                    valueLoc.source = valueLoc.source.slice(1, -1)
                }

                props.push({
                    type: NodeTypes.DIRECTIVE,
                    name: dirName,
                    exp: value && {
                        type: NodeTypes.SIMPLE_EXPRESSION,
                        content: value.content,
                        isStatic: false,
                        loc: value.loc
                    },
                    arg,
                    loc
                })
            }
        }
        advanceSpace(context);
    }
    return props;
}

function parseAttributeValue(context: ParserContext) {
    const start = getCursor(context);
    let content!: string;

    const quote = context.source[0];
    const isQuoted = quote === `"` || quote === `'`;
    if (isQuoted) {
        // Quoted value.
        advanceBy(context, 1)
        const endIndex = context.source.indexOf(quote)
        content = parseTextData(context, endIndex)
        advanceBy(context, 1)
    }
    return { content, isQuoted, loc: getSelection(context, start) }
}

function parseText(context: ParserContext) {
  
    const endTokens = ['<', context.options.delimiters[0]]
  
    let endIndex = context.source.length;
    for (let i = 0, len = endTokens.length; i < len; i++) {
        const index = context.source.indexOf(endTokens[i], 1)
        if (index !== -1 && endIndex > index) {
            endIndex = index
        }
    }
  
    const start = getCursor(context)
    const content = parseTextData(context, endIndex)
  
    return {
        type: NodeTypes.TEXT,
        content,
        loc: getSelection(context, start)
    }
}

function parseTextData(
    context: ParserContext,
    length: number,
): string {
    const rawText = context.source.slice(0, length)
    advanceBy(context, length)
    return rawText;
}

function advanceSpace(content: any) {
    const match = tagSpaceRe.exec(content.source);
    match && advanceBy(content, match[0].length);
}

function advanceBy(context: any, numberOfCharacters: number) {
    const { source } = context;
    advancePositionWithMutation(context, source, numberOfCharacters);
    context.source = source.slice(numberOfCharacters);
}

function advancePositionWithMutation(
    pos: Position,
    source: string,
    numberOfCharacters: number = source.length
): Position {
    let linesCount = 0
    let lastNewLinePos = -1
    for (let i = 0; i < numberOfCharacters; i++) {
        if (source.charCodeAt(i) === 10 /* newline char code */) {
            linesCount++
            lastNewLinePos = i
        }
    }
  
    pos.offset += numberOfCharacters
    pos.line += linesCount
    pos.column =
      lastNewLinePos === -1
        ? pos.column + numberOfCharacters
        : numberOfCharacters - lastNewLinePos
  
    return pos
}

function getNewPosition(context: ParserContext, start: Position, numberOfCharacters: number): Position {
    return advancePositionWithClone(
      start,
      context.originalSource.slice(start.offset, numberOfCharacters),
      numberOfCharacters
    )
}

export function advancePositionWithClone(
    pos: Position,
    source: string,
    numberOfCharacters: number = source.length
): Position {
    return advancePositionWithMutation(
        extend({}, pos),
        source,
        numberOfCharacters
    )
}

function startsWith(source: string, searchString: string): boolean {
    return source.startsWith(searchString)
}

function isEnd(
    context: ParserContext,
    ancestors: any
): boolean {
    const s = context.source
    if (startsWith(s, '</')) {
        for (let i = ancestors.length - 1; i >= 0; --i) {
            if (startsWithEndTagOpen(s, ancestors[i].tag)) {
                return true
            }
        }
    }
    return !s
}
  
function startsWithEndTagOpen(source: string, tag: string): boolean {
    return (
        startsWith(source, '</') &&
        source.substr(2, tag.length).toLowerCase() === tag.toLowerCase() &&
        /[\t\r\n\f />]/.test(source[2 + tag.length] || '>')
    )
}