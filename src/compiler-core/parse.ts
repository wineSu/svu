import {
    ParserContext,
    Position,
    TextModes,
    Namespaces
} from '../shared/svu'

import {
    NO
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

// parse
function parseChildren(
    context: ParserContext,
    mode: TextModes,
    ancestors: any
) {
    const parent = ancestors[ancestors.length - 1];
    const ns = parent ? parent.ns : Namespaces.HTML;
    const nodes = [];
}