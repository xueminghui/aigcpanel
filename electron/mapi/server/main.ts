import ServerApi from './api'
import {ipcMain} from "electron";
import {Log} from "../log/main";
import {mapError} from "./error";
import {AigcServer} from "../../aigcserver";
import {ServerContext, ServerInfo} from "./type";

const serverModule: {
    [key: string]: ServerContext
} = {}

const init = () => {

}

const getModule = async (serverInfo: ServerInfo): Promise<ServerContext> => {
    if (!serverModule[serverInfo.localPath]) {
        try {
            let mapName = serverInfo.name
            if (mapName.startsWith('Cloud')) {
                mapName = 'Cloud'
            }
            if (mapName in AigcServer) {
                const server = AigcServer[mapName] as ServerContext
                server.type = 'buildIn'
                server.ServerApi = ServerApi
                await server.init()
                serverModule[serverInfo.localPath] = server
            } else {
                const serverPath = `${serverInfo.localPath}/server.js`
                const module = await import(`file://${serverPath}`)
                module.default.type = 'custom'
                module.default.ServerApi = ServerApi
                await module.default.init()
                serverModule[serverInfo.localPath] = module.default
            }
        } catch (e) {
            const error = mapError(e)
            Log.error('mapi.server.getModule.error', error)
            throw error
        }
    }
    // console.log('getModule', serverInfo, serverModule[serverInfo.localPath])
    serverModule[serverInfo.localPath].ServerInfo = serverInfo
    return serverModule[serverInfo.localPath]
}

ipcMain.handle('server:start', async (event, serverInfo: ServerInfo) => {
    const module = await getModule(serverInfo)
    try {
        return await module.start()
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
        return await module.stop()
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
        Log.error('mapi.server.callFunction.error', {
            type: typeof (e),
            error
        })
        throw error
    }
})

export default {
    init
}
