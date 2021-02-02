import {
    ParserContext,
    Position,
    TextModes,
    Namespaces
} from '../shared/svu'

import {
    createRoot
} from './ast'

export function baseParse(content: string){
    const context = {
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