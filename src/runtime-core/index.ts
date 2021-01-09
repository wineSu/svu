import {
    RootRenderFunction,
    VNode
} from '../shared/svu';

import {
    createVnode
} from './vnode';

const createRenderer = (options?: object) => {

    const render: RootRenderFunction = (vnode, container)=>{
        console.log(vnode, container)
    }

    return {
        createApp: createAppAPI(render)
    }
}

function createAppAPI<HostElement>(
    render: RootRenderFunction
){
    return function createApp(root: string){
        const app = {
            mount(container: HostElement){
                // 第一步创建vnode
                let vnode = createVnode(root, null);
                // 第二步 执行渲染
                render(vnode, container);
            }
        }
        return app;
    }
}

const h = (type: any, props?: any, children?: any): VNode => createVnode(type, props, children);

export {
    createRenderer,
    h
}