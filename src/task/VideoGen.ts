import {TaskBiz} from "../store/modules/task";
import {useServerStore} from "../store/modules/server";
import {VideoGenService} from "../service/VideoGenService";
import {VideoTemplateService} from "../service/VideoTemplateService";
import {SoundTtsService} from "../service/SoundTtsService";
import {SoundCloneService} from "../service/SoundCloneService";

const serverStore = useServerStore()

const prepareData = async (bizId, bizParam) => {
    const record = await VideoGenService.get(bizId as any)
    // console.log('VideoGen.runFunc.record', record)
    if (!record) {
        throw new Error('record not found')
    }
    const server = await serverStore.getByNameVersion(record.serverName, record.serverVersion)
    // console.log('VideoGen.runFunc.server', server)
    if (!server) {
        throw new Error('server not found')
    }
    return {
        record,
        server,
    }
}
export const VideoGen: TaskBiz = {

    restore: async () => {
        await VideoGenService.restoreForTask()
    },

    runFunc: async (bizId, bizParam) => {
        // console.log('VideoGen.runFunc', {bizId, bizParam})
        const {record, server} = await prepareData(bizId, bizParam)
        const serverInfo = await serverStore.serverInfo(server)
        // console.log('VideoGen.runFunc.serverInfo', serverInfo)
        await VideoGenService.update(bizId as any, {
            status: 'running',
        })
        const videoTemplateRecord = await VideoTemplateService.get(record.videoTemplateId)
        if (!videoTemplateRecord) {
            throw new Error('VideoTemplateEmpty')
        }
        let soundFile: string | null = null
        if (record.soundType === 'soundTts') {
            const soundTtsRecord = await SoundTtsService.get(record.soundTtsId)
            soundFile = soundTtsRecord?.resultWav as string
        } else if (record.soundType === 'soundClone') {
            const soundCloneRecord = await SoundCloneService.get(record.soundCloneId)
            soundFile = soundCloneRecord?.resultWav as string
        }
        if (!soundFile) {
            throw new Error('SoundFileEmpty')
        }
        const res = await window.$mapi.server.callFunction(serverInfo, 'videoGen', {
            videoFile: videoTemplateRecord?.video,
            soundFile: soundFile,
            param: record.param,
        })
        // console.log('VideoGen.runFunc.res', res)
        if (res.code) {
            if (res.msg) {
                throw new Error(res.msg)
            } else {
                throw new Error('apiRequest videoGen fail')
            }
        }
        switch (res.data.type) {
            case 'success':
                await VideoGenService.update(bizId as any, {
                    status: 'success',
                    jobId: '',
                    jobResult: res,
                })
                return 'success'
            case 'querying':
                await VideoGenService.update(bizId as any, {
                    jobId: res.data.jobId,
                })
                return 'querying'
            case 'retry':
                return 'retry'
        }
        throw new Error('unknown res.data.type')
    },
    queryFunc: async (bizId, bizParam) => {
        // console.log('SoundTts.queryFunc', {bizId, bizParam})
        throw new Error('RequestError')
    },
    successFunc: async (bizId, bizParam) => {
        console.log('VideoGen.successFunc', {bizId, bizParam})
        const {record, server} = await prepareData(bizId, bizParam)
        console.log('VideoGen.successFunc.record', {record, server})
        const resultMp4 = await VideoGenService.saveResultMp4(record, record.jobResult.data.data.filePath)
        // console.log('VideoGen.successFunc.resultMp4', resultMp4)
        await VideoGenService.update(bizId as any, {
            status: 'success',
            endTime: Date.now(),
            resultMp4: resultMp4
        })
    },
    failFunc: async (bizId, msg, bizParam) => {
        console.log('VideoGen.failFunc', {bizId, bizParam, msg})
        // const {record, server} = await prepareData(bizId, bizParam)
        await VideoGenService.update(bizId as any, {
            status: 'fail',
            statusMsg: msg,
            endTime: Date.now(),
        })
    }
}
