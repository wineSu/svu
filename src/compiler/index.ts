import {
    baseCompile
} from '../compiler-core/compile';

// 模板编译
export function compile(template: string) {
    let {code} = baseCompile(template);
    let temp = `const _Vue = Vue
        const {createVnode, openBlock, createBlock } = _Vue
        ${ code }
    `;
    return new Function(temp);
}
