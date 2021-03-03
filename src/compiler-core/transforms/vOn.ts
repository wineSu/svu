import {
    createObjectProperty,
    createSimpleExpression,
} from '../ast'

import{
    NodeTypes
} from '../../shared/svu'

export const transformOn = (
    dir: any,
) => {
    const { loc, arg } = dir
    
    let eventName
    if (arg.type === NodeTypes.SIMPLE_EXPRESSION) {
        if (arg.isStatic) {
            eventName = createSimpleExpression(
                'click',
                true,
                arg.loc
            )
        }
    }
    // handler processing
    let exp = dir.exp;
    if (exp && !exp.content.trim()) {
        exp = undefined
    }
    let ret = {
        props: [
            createObjectProperty(
                eventName,
                exp || createSimpleExpression(`() => {}`, false, loc)
            )
        ]
    }
    return ret
}
