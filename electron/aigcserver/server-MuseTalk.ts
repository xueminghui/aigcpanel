import {VersionUtil} from "../lib/util";
import {ServerApiType} from "../mapi/server/type";

const serverRuntime = {
    port: 0,
}

let shellController = null
let isRunning = false


export const ServerMuseTalk = {
    ServerApi: null as ServerApiType | null,
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
                command.push(`--env=LAUNCHER_PORT=${serverRuntime.port}`)
                command.push(`--debug`)
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
        console.log('command', JSON.stringify(command))
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
            const res = await this.ServerApi.request(`${this._url()}ping`)
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
        if (!serverRuntime.port) {
            serverRuntime.port = 50617
        }
        if (!serverInfo.logFile) {
            serverInfo.logFile = `${serverInfo.localPath}/log-debug.txt`
        }
        console.log('videoGen', JSON.stringify({serverInfo, data, serverRuntime}))
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
            if (VersionUtil.ge(serverInfo.version, '0.2.0')) {
                const configYaml = await this.ServerApi.file.temp('yaml')
                await this.ServerApi.file.write(configYaml, [
                    'task_0:',
                    `  video_path: ${data.videoFile}`,
                    `  audio_path: ${data.soundFile}`,
                    `  bbox_shift: ${data.param.box}`,
                    '',
                ].join('\n'), {
                    isFullPath: true
                })
                console.log('configYaml', configYaml)
                let outputFile = ''
                const submitRet = await this.ServerApi.requestPost(`${this._url()}submit`, {
                    entryPlaceholders: {
                        'CONFIG': configYaml
                    },
                    root: serverInfo.localPath,
                })
                console.log('submitRet', JSON.stringify(submitRet))
                if (submitRet.code) {
                    throw new Error(`submit ${submitRet.msg}`)
                }
                for (let i = 0; i < 3600 * 24 / 5; i++) {
                    await this.ServerApi.sleep(5000)
                    const queryRet = await this.ServerApi.requestPost(`${this._url()}query`, {
                        token: submitRet.data.token
                    })
                    console.log('queryRet', JSON.stringify(queryRet))
                    if (queryRet.code) {
                        throw new Error(queryRet.msg)
                    }
                    let logs = queryRet.data.logs
                    if (logs) {
                        logs = this.ServerApi.base64Decode(logs)
                        if (logs) {
                            await this.ServerApi.file.appendText(serverInfo.logFile, logs)
                            const match = logs.match(/ResultSaveTo:([.\/\w_-]+\.mp4)/);
                            if (match) {
                                outputFile = match[1];
                                break
                            }
                        }
                    }
                    if (queryRet.data.status === 'success') {
                        resultData.end = Date.now()
                        await this.ServerApi.file.appendText(serverInfo.logFile, 'success')
                        break
                    }
                }
                if (!outputFile) {
                    throw new Error('outputFile not found')
                }
                const videoUrl = `${this._url()}download/${outputFile}`
                const videoLocal = await this.ServerApi.file.temp('mp4')
                await this.ServerApi.requestUrlFileToLocal(videoUrl, videoLocal)
                console.log('video', {
                    videoUrl,
                    videoLocal
                })
                resultData.data.filePath = videoLocal
            } else {
                const client = await this._client()
                const payload = []
                payload.push(this.ServerApi.GradioHandleFile(data.videoFile))
                payload.push(this.ServerApi.GradioHandleFile(data.soundFile))
                payload.push(parseInt(data.param.box))
                const result = await client.predict("/predict", payload);
                console.log('videoGen.result', JSON.stringify(result))
                resultData.end = Date.now()
                resultData.data.filePath = result.data[0].value.video.path
            }
            return {
                code: 0,
                msg: 'ok',
                data: resultData
            }
        } catch (e) {
            console.log('videoGen.error', e)
            throw e
        } finally {
            isRunning = false
        }
    },
}
