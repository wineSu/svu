import {
    DOMRenderOptions,
    Style,
    RendererNode
} from '../shared/svu';
import {
    isString,
    isOn,
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

function patchEvent(
    el: RendererNode,
    rawName: string,
    prevValue: any,
    nextValue: any,
) {
    const invokers = el._vei || (el._vei = {});
    const existingInvoker = invokers[rawName]
    if (nextValue && existingInvoker) {
        existingInvoker.value = nextValue
    } else {
        const name = rawName.replace('on', '').toLowerCase();
        if (nextValue) {
            // add
            el.addEventListener(name, nextValue)
        } else if (existingInvoker) {
            // remove
            el.removeEventListener(name, existingInvoker)
            invokers[rawName] = undefined
        }
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
            // 事件处理
            if(isOn(key)){
                patchEvent(el, key, prevValue, nextValue)
            }else{
                patchAttr(el, key, nextValue);
            }
    }
}