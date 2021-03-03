import { baseParse } from './parse';
import { transform } from './transform';

/**
 * 模板编译：
 *  parser(ast) --> transform --> generate
 */
export function baseCompile(template: string) {
    const ast = baseParse(template);
    // transform(ast);
    console.log('ast', ast)
    return '';
}