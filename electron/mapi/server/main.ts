import ServerApi from './api'
import {ipcMain} from "electron";
import {Log} from "../log/main";
import {mapError} from "./error";
import {AigcServer} from "../../aigcserver";

type ServerModule = {
    type: 'buildIn' | 'custom',
    init: (api: typeof ServerApi) => Promise<any>,
    start: (serverInfo: ServerInfo) => Promise<any>,
    stop: (serverInfo: ServerInfo) => Promise<any>,
    ping: () => Promise<boolean>,
    config: () => Promise<any>,
}

const serverModule: {
    [key: string]: ServerModule
} = {}

const init = () => {

}

const getModule = async (serverInfo: ServerInfo): Promise<ServerModule> => {
    if (!serverModule[serverInfo.localPath]) {
        try {
            if (serverInfo.name in AigcServer) {
                const server = AigcServer[serverInfo.name]
                await server.init(ServerApi)
                server.type = 'buildIn'
                serverModule[serverInfo.localPath] = server
            } else {
                const serverPath = `${serverInfo.localPath}/server.js`
                const module = await import(`file://${serverPath}`)
                // console.log('module', module)
                await module.default.init(ServerApi)
                module.default.type = 'custom'
                serverModule[serverInfo.localPath] = module.default
            }
        } catch (e) {
            const error = mapError(e)
            Log.error('mapi.server.getModule.error', error)
            throw error
        }
    }
    // console.log('getModule', serverInfo, serverModule[serverInfo.localPath])
    return serverModule[serverInfo.localPath]
}

ipcMain.handle('server:start', async (event, serverInfo: ServerInfo) => {
    const module = await getModule(serverInfo)
    try {
        return await module.start(serverInfo)
    } catch (e) {
        const error = mapError(e)
        Log.error('mapi.server.start.error', error)
        throw error
    }
})

ipcMain.handle('server:ping', async (event, serverInfo: ServerInfo) => {
    const module = await getModule(serverInfo)
    try {
        return await module.ping()
    } catch (e) {
        const error = mapError(e)
        Log.error('mapi.server.ping.error', error)
        throw error
    }
    return false
})

ipcMain.handle('server:stop', async (event, serverInfo: ServerInfo) => {
    const module = await getModule(serverInfo)
    try {
        return await module.stop(serverInfo)
    } catch (e) {
        const error = mapError(e)
        Log.error('mapi.server.stop.error', error)
        throw error
    }
})

ipcMain.handle('server:config', async (event, serverInfo: ServerInfo) => {
    const module = await getModule(serverInfo)
    try {
        return await module.config()
    } catch (e) {
        const error = mapError(e)
        Log.error('mapi.server.config.error', error)
        throw error
    }
})

ipcMain.handle('server:callFunction', async (event, serverInfo: ServerInfo, method: string, data: any) => {
    // console.log('getModule.before', serverInfo, method)
    const module = await getModule(serverInfo)
    // console.log('getModule.end', serverInfo, method, module)
    const func = module[method]
    if (!func) {
        throw new Error(`MethodNotFound : ${method}`)
    }
    try {
        return await func.bind(module)(serverInfo, data)
    } catch (e) {
        const error = mapError(e)
        Log.error('mapi.server.callFunction.error', error)
        throw error
    }
})

export default {
    init
}
