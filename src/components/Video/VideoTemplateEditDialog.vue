<script setup lang="ts">
import {ref} from "vue";
import {Dialog} from "../../lib/dialog";
import {t} from "../../lang";
import VideoPlayer from "../common/VideoPlayer.vue";
import {VideoTemplateRecord, VideoTemplateService} from "../../service/VideoTemplateService";
import {StringUtil} from "../../lib/util";

const visible = ref(false)
const videoPlayer = ref<InstanceType<typeof VideoPlayer> | null>(null)

const formData = ref({
    name: '',
    video: '',
})

const add = () => {
    formData.value.name = ''
    formData.value.video = ''
    visible.value = true
}

const doSelectFile = async () => {
    const path = await window.$mapi.file.openFile({
        accept: 'video/*'
    })
    if (path) {
        formData.value.video = path
        // videoPlayer.value?.loadVideo(path)
    }
}

const doSave = async () => {
    if (!formData.value.name) {
        Dialog.tipError(t('请输入名称'))
        return
    }
    if (!formData.value.video) {
        Dialog.tipError(t('请选择视频'))
        return
    }
    const exists = await VideoTemplateService.getByName(formData.value.name)
    if (exists) {
        Dialog.tipError(t('名称重复'))
        return
    }
    const videoPathFull = await window.$mapi.file.fullPath(`videoTemplate/${StringUtil.random()}.mp4`)
    await window.$mapi.file.copy(formData.value.video, videoPathFull, {
        isFullPath: true
    })
    await VideoTemplateService.insert({
        name: formData.value.name,
        video: videoPathFull,
    } as VideoTemplateRecord)
    visible.value = false
    emit('update')
}

defineExpose({
    add
})

const emit = defineEmits({
    update: () => true
})

</script>

<template>
    <a-modal v-model:visible="visible"
             width="60vw"
             title-align="start">
        <template #title>
            {{ $t('添加视频模板') }}
        </template>
        <template #footer>
            <a-button type="primary" @click="doSave">
                {{ $t('保存') }}
            </a-button>
        </template>
        <div style="max-height:60vh;">
            <a-form :model="{}" layout="vertical">
                <a-form-item :label="$t('名称')" required>
                    <a-input v-model="formData.name"/>
                </a-form-item>
                <a-form-item :label="$t('视频')" required>
                    <div class="w-full">
                        <div class="mb-3" v-if="formData.video">
                            <div class="w-80 h-48">
                                <VideoPlayer ref="videoPlayer" :url="`file://${formData.video}`"/>
                            </div>
                        </div>
                        <div class="mb-3">
                            <a-button @click="doSelectFile">
                                <template #icon>
                                    <icon-upload/>
                                </template>
                                {{ $t('选择视频文件') }}
                            </a-button>
                        </div>
                    </div>
                </a-form-item>
            </a-form>
        </div>
    </a-modal>
</template>
