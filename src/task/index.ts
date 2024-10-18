import {useTaskStore} from "../store/modules/task";
import {SoundTts} from "./SoundTts";
import {nextTick} from "vue";
import {SoundClone} from "./SoundClone";

const taskStore = useTaskStore()

export const TaskManager = {
    init() {
        taskStore.register('SoundTts', SoundTts)
        taskStore.register('SoundClone', SoundClone)
        nextTick(async () => {
            await SoundTts.restore?.()
            await SoundClone.restore?.()
        }).then()
        // taskStore.register('TestSync', TestSync)
        // taskStore.register('TestAsync', TestAsync)
        // setInterval(async () => {
        //     // await taskStore.dispatch('TestSync', StringUtil.random())
        //     await taskStore.dispatch('TestAsync', StringUtil.random(), {
        //         'a': 1,
        //     }, {
        //         timeout: 3 * 1000,
        //     })
        // }, 10 * 1000)
    },
    count() {
        return taskStore.records.length
    }
}
