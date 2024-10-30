import ServerApi from './api'
import {ipcMain} from "electron";
import {Log} from "../log/main";

const serverModule = {}

const init = () => {

}

const getModule = async (serverInfo: ServerInfo) => {
    // console.log('getModule', serverInfo)
    if (!serverModule[serverInfo.localPath]) {
        try {
            const serverPath = `${serverInfo.localPath}/server.js`
            const module = await import(`file://${serverPath}`)
            // console.log('module', module)
            await module.default.init(ServerApi)
            serverModule[serverInfo.localPath] = module.default
        } catch (e) {
            Log.error('mapi.server.getModule.error', e)
            throw new Error(e)
        }
    }
    return serverModule[serverInfo.localPath]
}

ipcMain.handle('server:start', async (event, serverInfo: ServerInfo) => {
    const module = await getModule(serverInfo)
    return await module.start(serverInfo)
})

ipcMain.handle('server:ping', async (event, serverInfo: ServerInfo) => {
    const module = await getModule(serverInfo)
    return await module.ping()
})

ipcMain.handle('server:stop', async (event, serverInfo: ServerInfo) => {
    const module = await getModule(serverInfo)
    return await module.stop(serverInfo)
})

ipcMain.handle('server:config', async (event, serverInfo: ServerInfo) => {
    const module = await getModule(serverInfo)
    return await module.config()
})

ipcMain.handle('server:callFunction', async (event, serverInfo: ServerInfo, method: string, data: any) => {
    // console.log('getModule.before', serverInfo, method)
    const module = await getModule(serverInfo)
    // console.log('getModule.end', serverInfo, method, module)
    const func = module[method]
    if (!func) {
        throw new Error(`MethodNotFound : ${method}`)
    }
    return await func.bind(module)(serverInfo, data)
})

export default {
    init
}
