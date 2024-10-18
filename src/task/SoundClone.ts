import {TaskBiz} from "../store/modules/task";
import {useServerStore} from "../store/modules/server";
import {SoundCloneService} from "../service/SoundCloneService";

const serverStore = useServerStore()

const prepareData = async (bizId, bizParam) => {
    const record = await SoundCloneService.get(bizId as any)
    // console.log('SoundClone.runFunc.record', record)
    if (!record) {
        throw new Error('record not found')
    }
    const server = await serverStore.getByNameVersion(record.serverName, record.serverVersion)
    // console.log('SoundClone.runFunc.server', server)
    if (!server) {
        throw new Error('server not found')
    }
    return {
        record,
        server,
    }
}
export const SoundClone: TaskBiz = {

    restore: async () => {
        await SoundCloneService.restoreForTask()
    },

    runFunc: async (bizId, bizParam) => {
        // console.log('SoundClone.runFunc', {bizId, bizParam})
        const {record, server} = await prepareData(bizId, bizParam)
        const res = await serverStore.apiRequest(server, '/soundClone', {
            text: record.text,
            promptAudio: record.promptWav,
            promptText: record.promptText,
            speed: parseFloat(record.speed as any),
            seed: parseInt(record.seed as any),
        })
        // console.log('SoundClone.runFunc.res', res)
        if (res.code) {
            if (res.msg) {
                throw new Error(res.msg)
            }
            throw new Error('apiRequest soundClone fail')
        }
        if (!res.data.jobId) {
            return 'retry'
        }
        await SoundCloneService.update(bizId as any, {
            status: 'running',
            jobId: res.data.jobId,
        })
        return 'success'
    },
    queryFunc: async (bizId, bizParam) => {
        // console.log('SoundClone.queryFunc', {bizId, bizParam})
        const {record, server} = await prepareData(bizId, bizParam)
        // console.log('SoundClone.queryFunc.prepareData', {bizId, bizParam, record, server})
        const res = await serverStore.apiRequest(server, '/query', {
            jobId: record.jobId,
        })
        await SoundCloneService.update(bizId as any, {
            jobResult: res,
        })
        // console.log('SoundClone.queryFunc.res', res)
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
        // console.log('SoundClone.successFunc', {bizId, bizParam})
        const {record, server} = await prepareData(bizId, bizParam)
        const resultWav = await SoundCloneService.saveResultWav(record, record.jobResult.data.data.filePath)
        // console.log('SoundClone.successFunc.resultWav', resultWav)
        await SoundCloneService.update(bizId as any, {
            status: 'success',
            endTime: Date.now(),
            resultWav: resultWav
        })
    },
    failFunc: async (bizId, msg, bizParam) => {
        // console.log('SoundClone.failFunc', {bizId, bizParam, msg})
        // const {record, server} = await prepareData(bizId, bizParam)
        await SoundCloneService.update(bizId as any, {
            status: 'fail',
            statusMsg: msg,
            endTime: Date.now(),
        })
    }
}
