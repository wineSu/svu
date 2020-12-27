// 预留 等实现完成响应式
const createApp = (component: any) => ({
    mount: (app: string) => {
        console.log(app)
        // 执行 setup
        component.setup();
    }
})

export {
    createApp
}