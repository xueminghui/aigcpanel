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
        const serverInfo = await serverStore.serverInfo(server)
        // console.log('SoundTts.runFunc.serverInfo', serverInfo)
        await SoundTtsService.update(bizId as any, {
            status: 'running',
        })
        const res = await window.$mapi.server.callFunction(serverInfo, 'soundTts', {
            text: record.text,
            param: record.param,
        })
        // console.log('SoundTts.runFunc.res', res)
        if (res.code) {
            if (res.msg) {
                throw new Error(res.msg)
            } else {
                throw new Error('apiRequest soundTts fail')
            }
        }
        switch (res.data.type) {
            case 'success':
                await SoundTtsService.update(bizId as any, {
                    status: 'success',
                    jobId: '',
                    jobResult: res,
                })
                return 'success'
            case 'querying':
                await SoundTtsService.update(bizId as any, {
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
