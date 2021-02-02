import { baseParse } from './parse';

/**
 * 模板编译：
 *  parser(ast) --> transform --> generate
 */
export function baseCompile(template: string) {
    const ast = baseParse(template);
    console.log('ast', ast)
    return '';
}