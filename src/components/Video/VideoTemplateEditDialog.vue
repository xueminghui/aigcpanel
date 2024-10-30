<script setup lang="ts">
import {ref} from "vue";
import {useVideoTemplateStore} from "../../store/modules/videoTemplate";
import AudioPlayer from "../common/AudioPlayer.vue";
import {AudioUtil} from "../../lib/audio";
import {Dialog} from "../../lib/dialog";
import {StringUtil} from "../../lib/util";
import {t} from "../../lang";
import WebFileSelectButton from "../common/WebFileSelectButton.vue";

const visible = ref(false)
const audioPlayer = ref<InstanceType<typeof AudioPlayer>>(null)
const videoTemplateStore = useVideoTemplateStore()

const formData = ref({
    name: '',
    promptWav: '',
    promptText: '',
})

const add = () => {
    formData.value.name = ''
    formData.value.promptWav = ''
    formData.value.promptText = ''
    visible.value = true
}

const onSelectFile = async (file) => {
    await audioPlayer.value.setRecordFromFile(file)
}

const doSave = async () => {
    if (!formData.value.name) {
        Dialog.tipError(t('请输入名称'))
        return
    }
    const audioBuffer = audioPlayer.value.getAudioBuffer()
    if (!audioBuffer) {
        Dialog.tipError(t('请录制声音'))
        return
    }
    if (!formData.value.promptText) {
        Dialog.tipError(t('请输入参考文字'))
        return
    }
    const exists = await videoTemplateStore.getByName(formData.value.name)
    if (exists) {
        Dialog.tipError(t('名称重复'))
        return
    }
    const wav = AudioUtil.audioBufferToWav(audioBuffer)
    formData.value.promptWav = `videoTemplate/${StringUtil.random()}.wav`
    await window.$mapi.file.writeBuffer(formData.value.promptWav, wav)
    formData.value.promptWav = await window.$mapi.file.fullPath(formData.value.promptWav)
    await videoTemplateStore.add({
        name: formData.value.name,
        promptWav: formData.value.promptWav,
        promptText: formData.value.promptText,
    })
    visible.value = false
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
                        <div class="mb-3">
                            <AudioPlayer ref="audioPlayer" show-wave trim-enable record-enable/>
                        </div>
                        <div class="mb-3">
                            <WebFileSelectButton @select-file="onSelectFile"
                                                 accept="video/mp4">
                                <a-button>
                                    <template #icon>
                                        <icon-upload/>
                                    </template>
                                    {{ $t('选择视频文件') }}
                                </a-button>
                            </WebFileSelectButton>
                        </div>
                    </div>
                </a-form-item>
            </a-form>
        </div>
    </a-modal>
</template>
