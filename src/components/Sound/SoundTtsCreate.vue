<script setup lang="ts">

import ServerSelector from "../Server/ServerSelector.vue";
import {onMounted, ref, watch} from "vue";
import {useServerStore} from "../../store/modules/server";
import {Dialog} from "../../lib/dialog";
import {SoundTtsRecord, SoundTtsService} from "../../service/SoundTtsService";
import {StorageUtil} from "../../lib/storage";
import {mapError} from "../../lib/error";
import {t} from "../../lang";

const serverStore = useServerStore()

const formData = ref({
    serverKey: '',
    speaker: '',
    speed: 1.0,
    text: '',
    seed: '0',
});
const speakers = ref<string[]>([])

onMounted(() => {
    const old = StorageUtil.getObject('SoundTtsCreate.formData')
    formData.value.serverKey = old.serverKey || ''
    formData.value.speaker = old.speaker || ''
    formData.value.speed = old.speed || 1.0
    formData.value.text = old.text || ''
    formData.value.seed = old.seed || '0'
})

watch(() => formData.value, async (value) => {
    StorageUtil.set('SoundTtsCreate.formData', value)
}, {
    deep: true
})

watch(() => formData.value.serverKey, async (value) => {
    // console.log('formData.serverKey', value)
    const server = await serverStore.getByKey(value)
    if (server) {
        const res = await serverStore.apiConfig(server)
        if (res.code) {
            Dialog.tipError(mapError(res.msg))
            return
        }
        speakers.value = res.data.functions.soundTts.speakers
    }
})

const doRandomSeed = () => {
    formData.value.seed = Math.floor(Math.random() * 1000000) + ''
}

const doSubmit = async () => {
    if (!formData.value.serverKey) {
        Dialog.tipError(t('请选择模型'))
        return
    }
    if (!formData.value.speaker) {
        Dialog.tipError(t('请选择音色'))
        return
    }
    if (formData.value.seed === '') {
        Dialog.tipError(t('请输入随机种子'))
        return
    }
    if (!formData.value.text) {
        Dialog.tipError(t('请输入合成内容'))
        return
    }
    const server = await serverStore.getByKey(formData.value.serverKey)
    if (!server) {
        Dialog.tipError(t('模型不存在'))
        return
    }
    const record: SoundTtsRecord = {
        serverName: server.name,
        serverTitle: server.title,
        serverVersion: server.version,
        speaker: formData.value.speaker,
        text: formData.value.text,
        speed: formData.value.speed,
        seed: parseInt(formData.value.seed),
    }
    const id = await SoundTtsService.submit(record)
    formData.value.text = ''
    Dialog.tipSuccess(t('任务已经提交成功，等待合成完成'))
    emit('submitted')
}

const emit = defineEmits({
    submitted: () => true
})

</script>

<template>
    <div class="rounded-xl shadow border p-4">
        <div class="flex items-center">
            <div class="flex-grow flex items-center h-12">
                <div class="mr-1">
                    <a-tooltip :content="$t('模型')">
                        <i class="iconfont icon-server"></i>
                    </a-tooltip>
                </div>
                <div class="mr-3 w-64 flex-shrink-0">
                    <ServerSelector v-model="formData.serverKey" functionName="soundTts"/>
                </div>
                <div class="mr-1" v-if="speakers.length>0">
                    <a-tooltip :content="$t('音色')">
                        <i class="iconfont icon-speaker"></i>
                    </a-tooltip>
                </div>
                <div class="mr-3 w-32" v-if="speakers.length>0">
                    <a-select :placeholder="$t('选择角色')" size="small"
                              v-model="formData.speaker">
                        <a-option v-for="s in speakers">
                            {{ s }}
                        </a-option>
                    </a-select>
                </div>
                <div v-if="formData.serverKey">
                    <a-tooltip :content="$t('音速')">
                        <i class="iconfont icon-speed"></i>
                    </a-tooltip>
                </div>
                <div v-if="formData.serverKey" class="mr-4 w-48 flex-shrink-0">
                    <a-slider v-model="formData.speed" :marks="{'0.5':t('慢'),'1':t('正常'),'2':t('快')}"
                              show-tooltip
                              :min="0.5" :max="2" :step="0.1"/>
                </div>
                <div v-if="formData.serverKey" class="mr-2">
                    <a-popover>
                        <i class="iconfont icon-seed"></i>
                        <template #content>
                            <div class="text-sm">
                                <div class="font-bold mb-2">{{ $t('随机推理种子') }}</div>
                                <div>{{ $t('相同的种子可以确保每次生成结果数据一致') }}</div>
                            </div>
                        </template>
                    </a-popover>
                </div>
                <div v-if="formData.serverKey" class="mr-1 w-20 flex-shrink-0">
                    <a-input v-model="formData.seed" class="pb-seed-input" size="small"/>
                </div>
                <div v-if="formData.serverKey" class="mr-4">
                    <a-tooltip :content="$t('随机生成')">
                        <a class="inline-block" href="javascript:;"
                           @click="doRandomSeed">
                            <icon-refresh/>
                        </a>
                    </a-tooltip>
                </div>
            </div>
            <div class="flex items-center">
            </div>
        </div>
        <div class="pt-4">
            <a-textarea v-model="formData.text"
                        :placeholder="$t('输入语音内容开始合成')"></a-textarea>
        </div>
        <div class="pt-2">
            <a-button type="primary" @click="doSubmit">
                {{ $t('开始合成') }}
            </a-button>
        </div>
    </div>
</template>

<style lang="less" scoped>
:deep(.arco-slider) {
    margin-bottom: 0 !important;

    .arco-slider-mark {
        font-size: 10px !important;
    }
}

:deep(.pb-seed-input) {
    padding-left: 0;
    padding-right: 0;

    .arco-input {
        text-align: center;
    }
}
</style>
