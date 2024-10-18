<script setup lang="ts">
import {EnumServerStatus, ServerRecord} from "../../types/Server";
import {computed, ref} from "vue";

const props = defineProps<{
    record: ServerRecord,
}>()

const visible = ref(false)
const setting = ref({
    port: '',
    gpuMode: '',
})
const readonly = computed(() => {
    return ![
        EnumServerStatus.STOPPED,
        EnumServerStatus.ERROR,
    ].includes(props.record.status)
})

const show = () => {
    visible.value = true
}

const doSubmit = () => {
    console.log(setting.value)
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
            </a-form>
        </div>
    </a-modal>
</template>
