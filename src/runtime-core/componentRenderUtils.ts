import {
    ComponentInstance,
    VNodeChild,
    VNode,
} from '../shared/svu';

import {
    Comment,
    Text,
    createVnode,
    Fragment
} from './vnode';

import {
    isArray
} from '../shared'

export function renderComponentRoot(instance: ComponentInstance){
    const {
        render
    } = instance;
    return normalizeVNode(render());
}

export function normalizeVNode(child: VNodeChild): VNode {
    if (child == null || typeof child === 'boolean') {
      // empty placeholder
      return createVnode(Comment)
    } else if (isArray(child)) {
      // fragment
      return createVnode(Fragment, null, child)
    } else if (typeof child === 'object') {
      return child
    } else {
      // strings and numbers
      return createVnode(Text, null, String(child))
    }
}