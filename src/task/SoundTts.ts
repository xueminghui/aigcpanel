import {TaskBiz} from "../store/modules/task";
import {useServerStore} from "../store/modules/server";
import {SoundTtsService} from "../service/SoundTtsService";

const serverStore = useServerStore()

const prepareData = async (bizId, bizParam) => {
    const record = await SoundTtsService.get(bizId as any)
    // console.log('SoundTts.runFunc.record', record)
    if (!record) {
        throw new Error('record not found')
    }
    const server = await serverStore.getByNameVersion(record.serverName, record.serverVersion)
    // console.log('SoundTts.runFunc.server', server)
    if (!server) {
        throw new Error('server not found')
    }
    return {
        record,
        server,
    }
}
export const SoundTts: TaskBiz = {

    restore: async () => {
        await SoundTtsService.restoreForTask()
    },

    runFunc: async (bizId, bizParam) => {
        // console.log('SoundTts.runFunc', {bizId, bizParam})
        const {record, server} = await prepareData(bizId, bizParam)
        const res = await serverStore.apiRequest(server, '/soundTts', {
            text: record.text,
            speaker: record.speaker,
            speed: parseFloat(record.speed as any),
            seed: parseInt(record.seed as any),
        })
        // console.log('SoundTts.runFunc.res', res)
        if (res.code) {
            if (res.msg) {
                throw new Error(res.msg)
            }
            throw new Error('apiRequest soundTts fail')
        }
        if (!res.data.jobId) {
            return 'retry'
        }
        await SoundTtsService.update(bizId as any, {
            status: 'running',
            jobId: res.data.jobId,
        })
        return 'success'
    },
    queryFunc: async (bizId, bizParam) => {
        // console.log('SoundTts.queryFunc', {bizId, bizParam})
        const {record, server} = await prepareData(bizId, bizParam)
        // console.log('SoundTts.queryFunc.prepareData', {bizId, bizParam, record, server})
        const res = await serverStore.apiRequest(server, '/query', {
            jobId: record.jobId,
        })
        await SoundTtsService.update(bizId as any, {
            jobResult: res,
        })
        // console.log('SoundTts.queryFunc.res', res)
        if (res.code) {
            if (res.msg) {
                throw new Error(res.msg)
            }
            throw new Error('apiRequest query fail')
        }
        switch (res.data.status) {
            case 'running':
                return 'running'
            case 'success':
                return 'success'
            case 'fail':
            default:
                return 'fail'
        }
    },
    successFunc: async (bizId, bizParam) => {
        // console.log('SoundTts.successFunc', {bizId, bizParam})
        const {record, server} = await prepareData(bizId, bizParam)
        const resultWav = await SoundTtsService.saveResultWav(record, record.jobResult.data.data.filePath)
        // console.log('SoundTts.successFunc.resultWav', resultWav)
        await SoundTtsService.update(bizId as any, {
            status: 'success',
            endTime: Date.now(),
            resultWav: resultWav
        })
    },
    failFunc: async (bizId, msg, bizParam) => {
        // console.log('SoundTts.failFunc', {bizId, bizParam, msg})
        // const {record, server} = await prepareData(bizId, bizParam)
        await SoundTtsService.update(bizId as any, {
            status: 'fail',
            statusMsg: msg,
            endTime: Date.now(),
        })
    }
}
