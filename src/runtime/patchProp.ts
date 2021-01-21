import {
    DOMRenderOptions,
    Style,
    RendererNode
} from '../shared/svu';
import {
    isString
} from '../shared';

function patchClass(el: RendererNode, value: string | null) {
    if (value == null) {
        value = '';
    }
    el.className = value;
}

function patchStyle(el: RendererNode, prev: Style, next: Style) {
    const style: CSSStyleDeclaration = (el as HTMLElement).style;
    if (!next) {
        el.removeAttribute('style');
    } else if(isString(next)){
        if (prev !== next) {
            style.cssText = next
        }
    } else {
        for (const key in next) {
            style[key as any] = next[key];
        }
    }
}
function patchAttr(el: RendererNode, key: string, value: any) {
    if (value == null) {
        el.removeAttribute(key);
    } else {
        el.setAttribute(key, value);
    }
}

export const patchProp: DOMRenderOptions['patchProp'] = (
    el,
    key,
    prevValue,
    nextValue
) => {
    switch (key) {
        case 'class':
            patchClass(el, nextValue);
            break;
        case 'style':
            patchStyle(el, prevValue, nextValue);
            break;
        default:
            patchAttr(el, key, nextValue);
    }
}