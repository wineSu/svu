import {
    baseCompile
} from '../compiler-core/compile';

// 模板编译
export function compile(template: string) {
    let {code} = baseCompile(template);
    
    console.log(code)
    return new Function(code);
}
