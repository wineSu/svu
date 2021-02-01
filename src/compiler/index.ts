import {
    baseCompile
} from '../compiler-core/compile';

/**
 * 模板编译：
 *  parser(ast) --> transform --> generate
 */
export function compile(template: string) {
    let code = baseCompile(template);
    return new Function(code);
}
