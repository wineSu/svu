import {
    createRenderer,
    h
} from '../runtime-core';

import {
    isString
} from '../shared'

const createApp = (root: object) => {
    const app = createRenderer().createApp(root);
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
    h,
    createApp
}