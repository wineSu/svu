import {
    RootRenderFunction
} from '../shared/svu';

const createRenderer = (options?: object) => {

    const render = ()=>{

    }

    return {
        createApp: createAppAPI(render)
    }
}

function createAppAPI(
    render: RootRenderFunction
){
    return function createApp(root: object){
        const app = {
            mount(container: Element | ShadowRoot | string){
                console.log(container)
            }
        }
        return app;
    }
}

export {
    createRenderer
}