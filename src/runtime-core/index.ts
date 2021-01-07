const createRenderer = () => {
    return {
        createApp: (...arg: object[]) => {
            return {
                mount: () => {
                    
                }
            }
        }
    }
}

export {
    createRenderer
}