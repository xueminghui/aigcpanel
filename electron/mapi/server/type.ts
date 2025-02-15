import api from './api'

export type ServerApiType = typeof api

export type SendType = never
    // 服务
    | 'starting'
    | 'stopping'
    | 'stopped'
    | 'success'
    | 'error'
    // 任务
    | 'taskRunning'
    | 'taskParam'
    | 'taskResult'

export type ServerInfo = {
    localPath: string,
    name: string,
    version: string,
    setting: {
        [key: string]: any,
    },
    logFile: string,
    eventChannelName: string,
}

export type ServerContext = {
    url: () => string,
    send: (type: SendType, data: any) => void,
    ServerInfo: ServerInfo | null,
    [key: string]: any,
}

export type ServerFunctionDataType = {
    id: string,
    [key: string]: any,
}
