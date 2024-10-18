<script setup lang="ts">
import {EnumServerStatus, ServerRecord} from "../../types/Server";
import {computed, ref, toRaw} from "vue";
import {useServerStore} from "../../store/modules/server";
import {Dialog} from "../../lib/dialog";
import {clone, cloneDeep} from "lodash-es";

const serverStore = useServerStore()
const props = defineProps<{
    record: ServerRecord,
}>()

const visible = ref(false)
const setting = ref({
    port: '',
    gpuMode: '',
    entryCommand: '',
})
const readonly = computed(() => {
    return ![
        EnumServerStatus.STOPPED,
        EnumServerStatus.ERROR,
    ].includes(props.record.status)
})

const show = () => {
    visible.value = true
    setting.value.port = props.record.setting?.port || ''
    setting.value.gpuMode = props.record.setting?.gpuMode || ''
    setting.value.entryCommand = props.record.setting?.entryCommand || ''
}

const doSubmit = async () => {
    await serverStore.updateSetting(props.record.key, cloneDeep(toRaw(setting.value)))
    Dialog.tipSuccess('设置成功')
    visible.value = false
}

defineExpose({
    show
})
</script>

<template>
    <a-modal v-model:visible="visible"
             width="40rem"
             title-align="start">
        <template #title>
            {{ $t('设置') }}
        </template>
        <template #footer>
            <a-button type="primary"
                      :disabled="readonly"
                      @click="doSubmit">{{ $t('确定') }}
            </a-button>
        </template>
        <div>
            <a-form :model="{}">
                <a-form-item field="port" label="服务端口">
                    <a-input placeholder="留空会检测使用随机端口"
                             :readonly="readonly"
                             v-model="setting.port"/>
                </a-form-item>
                <a-form-item field="gpuMode" label="GPU模式">
                    <a-radio-group v-model="setting.gpuMode" :disabled="readonly">
                        <a-radio value="">{{ $t('GPU优先') }}</a-radio>
                        <a-radio value="cpu">{{ $t('使用CPU') }}</a-radio>
                    </a-radio-group>
                </a-form-item>
                <a-form-item field="entryCommand" label="启动命令">
                    <a-input v-model="setting.entryCommand"
                             :readonly="readonly"
                             placeholder="留空使用默认启动命令"/>
                </a-form-item>
            </a-form>
        </div>
    </a-modal>
</template>
