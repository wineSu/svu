import {
    createRenderer
} from '../runtime-core';
import {
    isString
} from '../shared'

const createApp = (...arg: object[]) => {
    const app = createRenderer().createApp(...arg);
    const { mount } = app;
    app.mount = (container: Element | ShadowRoot | string)=>{
        let dom = normalizeContainer(container);
        if(!dom){
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
      const res = document.querySelector(container)
      return res
    }
    return container as any
}

export {
    createApp
}