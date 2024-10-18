declare interface Window {
    $mapi: {
        app: {
            resourcePathResolve: (filePath: string) => Promise<string>,
            extraPathResolve: (filePath: string) => Promise<string>,
            platformName: () => 'win' | 'osx' | 'linux' | null,
            platformArch: () => 'x86' | 'arm64' | null,
            isPlatform: (platform: 'win' | 'osx' | 'linux') => boolean,
            quit: () => Promise<void>,
            windowMin: () => Promise<void>,
            windowMax: () => Promise<void>,
            windowSetSize: (width: number, height: number) => Promise<void>,
            windowHide: (name?: string) => Promise<void>,
            windowClose: (name?: string) => Promise<void>,
            openExternalWeb: (url: string) => Promise<void>,
            appEnv: () => Promise<any>,
            shell: (command: string, option: {} | null) => Promise<void>,
            spawnShell: (command: string | string[], option: {
                stdout?: Function,
                stderr?: Function,
                success?: Function,
                error?: Function,
            } | null) => Promise<{
                stop: () => void,
                send: (data: any) => void,
                result: () => Promise<string>
            }>,
            availablePort: (start: number) => Promise<number>,
            fixExecutable: (executable: string) => Promise<void>,
        },
        config: {
            get: (key: string, defaultValue: any = null) => Promise<any>,
            set: (key: string, value: any) => Promise<void>,
            all: () => Promise<any>,
        },
        log: {
            root: () => string,
            info: (msg: string, data: any = null) => Promise<void>,
            error: (msg: string, data: any = null) => Promise<void>,
        },
        storage: {
            all: () => Promise<any>,
            get: (group: string, key: string, defaultValue: any) => Promise<any>,
            set: (group: string, key: string, value: any) => Promise<void>,
        },
        db: {
            execute: (sql: string, params: any = []) => Promise<any>,
            insert: (sql: string, params: any = []) => Promise<any>,
            first: (sql: string, params: any = []) => Promise<any>,
            select: (sql: string, params: any = []) => Promise<any>,
            update: (sql: string, params: any = []) => Promise<any>,
            delete: (sql: string, params: any = []) => Promise<any>,
        },
        file: {
            fullPath: (path: string) => Promise<string>,
            absolutePath: (path: string) => string,
            exists: (path: string, option?: Record<string, any>) => Promise<boolean>,
            isDirectory: (path: string, option?: Record<string, any>) => Promise<boolean>,
            mkdir: (path: string, option?: Record<string, any>) => Promise<void>,
            list: (path: string, option?: Record<string, any>) => Promise<any[]>,
            listAll: (path: string, option?: Record<string, any>) => Promise<any[]>,
            write: (path: string, data: any, option?: Record<string, any>) => Promise<void>,
            writeBuffer: (path: string, data: any, option?: Record<string, any>) => Promise<void>,
            read: (path: string, option?: Record<string, any>) => Promise<any>,
            readBuffer: (path: string, option?: Record<string, any>) => Promise<any>,
            deletes: (path: string, option?: Record<string, any>) => Promise<void>,
            rename: (pathOld: string, pathNew: string, option?: Record<string, any>) => Promise<void>,
            copy: (pathOld: string, pathNew: string, option?: Record<string, any>) => Promise<void>,
            temp: (ext: string = 'tmp', prefix: string = 'file') => Promise<string>,
            tempDir: (prefix: string = 'dir') => Promise<string>,
            watchText: (path: string, callback: (data: {}) => void, option?: Record<string, any>) => Promise<{
                stop: Function,
            }>,
            appendText: (path: string, data: any, option?: Record<string, any>) => Promise<void>,
            openFile: (options: {} = {}) => Promise<any>,
            openDirectory: (options: {} = {}) => Promise<any>,
            openSave: (options: {} = {}) => Promise<any>,
            openPath: (path: string, options: {} = {}) => Promise<void>,
        },
        updater: {
            checkForUpdate: () => Promise<ApiResult<any>>,
        },
        statistics: {
            tick: (name: string, data: any = null) => Promise<void>,
        },
        lang: {
            writeSourceKey: (key: string) => Promise<void>,
            writeSourceKeyUse: (key: string) => Promise<void>,
        },
        event: {
            send: (name: string, type: string, data: any) => void,
            callThirdParty: (name: string, type: string, data: any, option?: any) => Promise<ApiResult<any>>,
            callPage: (name: string, type: string, data?: any, option?: any) => Promise<ApiResult<any>>,
        },
        page: {
            open: (name: string, option?: any) => Promise<void>,
        },
        user: {
            open: (option?: any) => Promise<void>,
            get: () => Promise<{
                apiToken: string,
                user: {
                    id: string,
                    name: string,
                    avatar: string,
                },
                data: any,
            }>,
            save: (data: {
                apiToken: string,
                user: {
                    id: string,
                    name: string,
                    avatar: string,
                },
                data: any,
            }) => Promise<void>,
        },
        misc: {
            // define any string to any value
            [key: string]: Function,
        },

        ffmpeg: {
            version: () => Promise<string>,
            run: (args: string[]) => Promise<string>,
        }
    }
}


