export enum EnumServerStatus {
    STOPPED = 'stopped',
    STARTING = 'starting',
    RUNNING = 'running',
    STOPPING = 'stopping',
    ERROR = 'error',
}

export enum EnumServerType {
    LOCAL = 'local',
    REMOTE = 'remote',
}

export type ServerRecord = {
    key: string,
    name: string,
    title: string,
    version: string,
    type?: EnumServerType,
    functions: string[],
    localPath?: string,
    localEntry?: string,
    setting: {
        port: string,
        gpuMode: '' | 'cpu',
        entryCommand: string,
    },
    status?: any,
    runtime?: any,
}

export type ServerRuntime = {
    status: EnumServerStatus,
    shellController: any,
    httpUrl: string,
    logFile: string,
    pingCheckTimer?: any,
    startTimestampMS?: number,
}


