import {
    createRenderer,
    createVnode,
    openBlock,
    createBlock
} from '../runtime-core';

import {
    nodeOps
} from './nodeOps';

import {
    isString,
} from '../shared';

import { 
    patchProp
} from './patchProp';

import {
    onBeforeMount,
    onMounted,
    onBeforeUpdate,
    onUpdated,
    onBeforeUnmount,
    onUnmounted
} from '../runtime-core/apiLifecycle'

const rendererOptions = Object.assign({ patchProp }, nodeOps)

const createApp = (root: string) => {
    const app = createRenderer(rendererOptions).createApp(root);
    const { mount } = app;
    app.mount = (container: Element | ShadowRoot | string)=>{
        let dom: Element | null = normalizeContainer(container);
        if(!dom){
            console.warn(`Failed to mount app: mount target selector "${container}" returned null.`)
            return;
        };
        dom.innerHTML = '';
        return mount(dom);
    }
    return app;
};

function normalizeContainer(
    container: Element | ShadowRoot | string
  ): Element | null {
    if (isString(container)) {
      return document.querySelector(container)
    }
    return container as any
}

export {
    createVnode,
    openBlock,
    createBlock,
    createApp,
    onBeforeMount,
    onMounted,
    onBeforeUpdate,
    onUpdated,
    onBeforeUnmount,
    onUnmounted
}