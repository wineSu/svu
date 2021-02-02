import {
    NodeTypes
} from '../shared/svu'

export const locStub = {
    source: '',
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 1, offset: 0 }
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