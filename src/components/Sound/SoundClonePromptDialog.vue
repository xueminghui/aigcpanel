<script setup lang="ts">
import {ref} from "vue";
import {SoundClonePromptRecord, useSoundClonePromptStore} from "../../store/modules/soundClonePrompt";
import SoundClonePromptEditDialog from "./SoundClonePromptEditDialog.vue";
import {Dialog} from "../../lib/dialog";
import AudioPlayer from "../common/AudioPlayer.vue";

const visible = ref(false)
const soundClonePromptStore = useSoundClonePromptStore()
const soundClonePromptEditDialog = ref<InstanceType<typeof SoundClonePromptEditDialog>>(null)

const show = () => {
    visible.value = true
}

const columns = [
    {
        title: '名称',
        dataIndex: 'name',
        width: 100,
    },
    {
        title: '参考文字',
        dataIndex: 'promptText',
        width: 200,
    },
    {
        title: '参考声音',
        slotName: 'promptPlayer',
    },
    {
        title: '操作',
        slotName: 'operate',
        width: 80,
    }
]

const doDelete = async (record: SoundClonePromptRecord) => {
    await Dialog.confirm('确认删除？')
    await soundClonePromptStore.delete(record.name)
}

defineExpose({
    show
})
</script>

<template>
    <a-modal v-model:visible="visible"
             width="80vw"
             :footer="false"
             title-align="start">
        <template #title>
            声音角色
        </template>
        <div>
            <div class="mb-3">
                <a-button @click="soundClonePromptEditDialog?.add()">
                    <template #icon>
                        <icon-plus/>
                    </template>
                    添加
                </a-button>
            </div>
            <a-table :scroll="{maxHeight:'40vh'}"
                     :columns="columns"
                     :pagination="false"
                     :data="soundClonePromptStore.records">
                <template #promptPlayer="{ record }">
                    <AudioPlayer show-wave :url="'file://'+record.promptWav"/>
                </template>
                <template #operate="{ record }">
                    <a-button @click="doDelete(record)">
                        <template #icon>
                            <icon-delete/>
                        </template>
                    </a-button>
                </template>
            </a-table>
        </div>
    </a-modal>
    <SoundClonePromptEditDialog ref="soundClonePromptEditDialog"/>
</template>
