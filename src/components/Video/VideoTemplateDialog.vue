<script setup lang="ts">
import {ref} from "vue";
import {useVideoTemplateStore, VideoTemplateRecord} from "../../store/modules/videoTemplate";
import VideoTemplateEditDialog from "./VideoTemplateEditDialog.vue";
import {Dialog} from "../../lib/dialog";
import AudioPlayer from "../common/AudioPlayer.vue";
import {t} from "../../lang";

const visible = ref(false)
const videoTemplateStore = useVideoTemplateStore()
const videoTemplateEditDialog = ref<InstanceType<typeof VideoTemplateEditDialog>>(null)

const show = () => {
    visible.value = true
}

const columns = [
    {
        title: t('名称'),
        dataIndex: 'name',
        width: 200,
    },
    {
        title: t('视频'),
        slotName: 'video',
    },
    {
        title: t('操作'),
        slotName: 'operate',
        width: 80,
    }
]

const doDelete = async (record: VideoTemplateRecord) => {
    await Dialog.confirm(t('确认删除？'))
    await videoTemplateStore.delete(record.name)
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
            {{ $t('视频模板') }}
        </template>
        <div>
            <div class="mb-3">
                <a-button @click="videoTemplateEditDialog?.add()">
                    <template #icon>
                        <icon-plus/>
                    </template>
                    {{ $t('添加') }}
                </a-button>
            </div>
            <div style="height:60vh;">
                <a-table :scroll="{maxHeight:'60vh'}"
                         :columns="columns"
                         :pagination="false"
                         :data="videoTemplateStore.records">
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
        </div>
    </a-modal>
    <VideoTemplateEditDialog ref="videoTemplateEditDialog"/>
</template>
