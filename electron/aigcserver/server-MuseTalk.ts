import {VersionUtil} from "../lib/util";

const serverRuntime = {
    port: 0,
}

let shellController = null
let isRunning = false

export const ServerMuseTalk = {
    ServerApi: null,
    _url() {
        return `http://localhost:${serverRuntime.port}/`
    },
    async _client() {
        return await this.ServerApi.GradioClient.connect(this._url());
    },
    _send(serverInfo, type, data) {
        this.ServerApi.event.sendChannel(serverInfo.eventChannelName, {type, data})
    },

    async init(ServerApi) {
        this.ServerApi = ServerApi;
    },
    async start(serverInfo) {
        console.log('start', JSON.stringify(serverInfo))
        this._send(serverInfo, 'starting', serverInfo)
        let command = []
        if (serverInfo.setting?.['port']) {
            serverRuntime.port = serverInfo.setting.port
        } else if (!serverRuntime.port || !await this.ServerApi.app.isPortAvailable(serverRuntime.port)) {
            serverRuntime.port = await this.ServerApi.app.availablePort(50617)
        }
        const env = await this.ServerApi.env()
        if (serverInfo.setting?.['startCommand']) {
            command.push(serverInfo.setting.startCommand)
        } else {
            if (VersionUtil.ge(serverInfo.version, '0.2.0')) {
                command.push(`"${serverInfo.localPath}/launcher"`)
                env['AIGCPANEL_SERVER_PORT'] = serverRuntime.port
                const dep = process.platform === 'win32' ? ';' : ':'
                env['PATH'] = process.env['PATH'] || ''
                env['PATH'] = `${serverInfo.localPath}/binary${dep}${env['PATH']}`
            } else {
                //command.push(`"${serverInfo.localPath}/server/main"`)
                command.push(`"${serverInfo.localPath}/server/.ai/python.exe"`)
                command.push('-u')
                command.push(`"${serverInfo.localPath}/server/run.py"`)
                if (serverInfo.setting?.['gpuMode'] === 'cpu') {
                    command.push('--gpu_mode=cpu')
                }
            }
        }
        shellController = await this.ServerApi.app.spawnShell(command, {
            env,
            cwd: serverInfo.localPath,
            stdout: (data) => {
                this.ServerApi.file.appendText(serverInfo.logFile, data)
            },
            stderr: (data) => {
                this.ServerApi.file.appendText(serverInfo.logFile, data)
            },
            success: (data) => {
                this._send(serverInfo, 'success', serverInfo)
            },
            error: (data, code) => {
                this.ServerApi.file.appendText(serverInfo.logFile, data)
                this._send(serverInfo, 'error', serverInfo)
            },

        })
    },
    async ping(serverInfo) {
        try {
            const res = await this.ServerApi.request(`${this._url()}info`)
            return true
        } catch (e) {
        }
        return false
    },
    async stop(serverInfo) {
        this._send(serverInfo, 'stopping', serverInfo)
        try {
            shellController.stop()
            shellController = null
        } catch (e) {
            console.log('stop error', e)
        }
        this._send(serverInfo, 'stopped', serverInfo)
    },
    async config() {
        return {
            "code": 0,
            "msg": "ok",
            "data": {
                "httpUrl": shellController ? this._url() : null,
                "functions": {
                    "videoGen": {
                        "param": [
                            {
                                name: "box",
                                type: "inputNumber",
                                title: "嘴巴张开度",
                                defaultValue: -7,
                                placeholder: "",
                                tips: '嘴巴张开度可以控制生成视频中嘴巴的张开程度',
                                min: -9,
                                max: 9,
                                step: 1,
                            }
                        ]
                    },
                }
            }
        }
    },
    async videoGen(serverInfo, data) {
        console.log('videoGen', JSON.stringify(data))
        const client = await this._client()
        const resultData = {
            // success, querying, retry
            type: 'success',
            start: 0,
            end: 0,
            jobId: '',
            data: {
                filePath: null
            }
        }
        if (isRunning) {
            resultData.type = 'retry'
            return {
                code: 0,
                msg: 'ok',
                data: resultData
            }
        }
        isRunning = true
        resultData.start = Date.now()
        try {
            const payload = []
            if (VersionUtil.ge(serverInfo.version, '0.2.0')) {
                payload.push(data.videoFile)
                payload.push(data.soundFile)
            } else {
                payload.push(this.ServerApi.GradioHandleFile(data.videoFile))
                payload.push(this.ServerApi.GradioHandleFile(data.soundFile))
            }
            payload.push(parseInt(data.param.box))
            const result = await client.predict("/predict", payload);
            console.log('videoGen.result', JSON.stringify(result))
            resultData.end = Date.now()
            if (VersionUtil.ge(serverInfo.version, '0.2.0')) {
                resultData.data.filePath = result.data[0].value[0].name
            } else {
                resultData.data.filePath = result.data[0].value.video.path
            }
            return {
                code: 0,
                msg: 'ok',
                data: resultData
            }
        } catch (e) {
            throw e
        } finally {
            isRunning = false
        }
    },
}
