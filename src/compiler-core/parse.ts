import {
    ParserContext,
    Position,
    TextModes,
    Namespaces,
    NodeTypes
} from '../shared/svu'

import {
    NO,
    isArray
} from '../shared'

import {
    createRoot
} from './ast'

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
    getTextMode: () => TextModes.DATA,
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
        inPre: false,
        inVPre: false
    }
    const start = getCursor(context);
    return createRoot(
        parseChildren(context, TextModes.DATA, []),
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
    return {
        start,
        end,
        source: context.originalSource.slice(start.offset, end.offset)
    }
}

/**
 * 1、整体结构解析 parseText
 * 2、细分结构 parseElement
 * 3、处理数据 parseInterpolation
 */
function parseChildren(
    context: ParserContext,
    mode: TextModes,
    ancestors: any
) {
    const parent = ancestors[ancestors.length - 1];
    const ns = parent ? parent.ns : Namespaces.HTML;
    const nodes = [];
    
    while (!isEnd(context, mode, ancestors)) {
        const s = context.source
        let node = undefined;
        
        if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
            if (!context.inVPre && startsWith(s, context.options.delimiters[0])) {
                // '{{'
                // node = parseInterpolation(context, mode)
            } else if (/[a-z]/i.test(s[1])) {
                // node = parseElement(context, ancestors)
            }
        }
        if (!node) {
            node = parseText(context, mode)
        }
    
        if (isArray(node)) {
            for (let i = 0, len = node.length; i < len; i++) {
                nodes.push(node[i])
            }
        } else {
            nodes.push(node);
        }
    }
    return nodes;
}

function parseText(context: ParserContext, mode: TextModes) {
  
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

function startsWith(source: string, searchString: string): boolean {
    return source.startsWith(searchString)
}

function last<T>(xs: T[]): T | undefined {
    return xs[xs.length - 1]
}
function isEnd(
    context: ParserContext,
    mode: TextModes,
    ancestors: any
): boolean {
    const s = context.source
  
    switch (mode) {
      case TextModes.DATA:
        if (startsWith(s, '</')) {
          for (let i = ancestors.length - 1; i >= 0; --i) {
            if (startsWithEndTagOpen(s, ancestors[i].tag)) {
              return true
            }
          }
        }
        break
  
      case TextModes.RCDATA:
      case TextModes.RAWTEXT: {
        const parent = last(ancestors)
        if (parent && startsWithEndTagOpen(s, (parent as any).tag)) {
          return true
        }
        break
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