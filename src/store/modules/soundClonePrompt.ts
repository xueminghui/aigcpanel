import {defineStore} from "pinia"
import store from "../index";
import {toRaw} from "vue";
import {cloneDeep} from "lodash-es";

export type SoundClonePromptRecord = {
    name: string,
    promptWav: string,
    promptText: string,
}

export const soundClonePromptStore = defineStore("soundClonePrompt", {
    state: () => ({
        records: [] as SoundClonePromptRecord[],
    }),
    actions: {
        async init() {
            await this.refresh()
        },
        async refresh() {
            await window.$mapi.storage.get("soundClonePrompt", "records", [])
                .then((records) => {
                    this.records = records
                })
        },
        async getByName(name: string) {
            return this.records.find((record) => record.name === name)
        },
        async add(record: SoundClonePromptRecord) {
            this.records.push(record)
            await this.sync()
        },
        async delete(name: string) {
            const record = await this.getByName(name)
            if (record) {
                const index = this.records.indexOf(record)
                this.records.splice(index, 1)
                await this.sync()
            }
        },
        async sync() {
            const savedRecords = toRaw(cloneDeep(this.records))
            savedRecords.forEach((record) => {
                // record.status = undefined
                // record.runtime = undefined
            })
            await window.$mapi.storage.set("soundClonePrompt", "records", savedRecords)
        },
    }
})

const soundClonePrompt = soundClonePromptStore(store)
soundClonePrompt.init().then(() => {
})

export const useSoundClonePromptStore = () => {
    return soundClonePrompt
}
