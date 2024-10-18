<script setup lang="ts">
import {EnumServerType, ServerRecord} from "../../types/Server";
import {ref} from "vue";
import {functionToLabels} from "../../lib/aigcpanel";

const props = defineProps<{
    record: ServerRecord,
}>()

const visible = ref(false)

const show = () => {
    visible.value = true
}

defineExpose({
    show
})
</script>

<template>
    <a-modal v-model:visible="visible"
             width="40rem"
             :footer="false"
             title-align="start">
        <template #title>
            {{ $t('模型信息') }}
        </template>
        <div>
            <div class="border rounded-lg p-3">
                <div class="flex mb-4">
                    <div class="w-20">类型</div>
                    <div>
                        <span v-if="record.type===EnumServerType.LOCAL">
                            <i class="iconfont icon-desktop mr-1"></i>
                            本地模型
                        </span>
                        <span v-else-if="record.type===EnumServerType.REMOTE">
                            <i class="iconfont icon-network mr-1"></i>
                            远程模型
                        </span>
                    </div>
                </div>
                <div class="flex mb-4">
                    <div class="w-20">模型</div>
                    <div>
                        {{ props.record.title }}
                    </div>
                </div>
                <div class="flex mb-4">
                    <div class="w-20">版本</div>
                    <div>
                        <a-tag>
                            v{{ props.record.version }}
                        </a-tag>
                    </div>
                </div>
                <div class="flex mb-4">
                    <div class="w-20">功能</div>
                    <div>
                        <a-tag v-for="label in functionToLabels(record.functions)" class="mr-1">
                            {{ label }}
                        </a-tag>
                    </div>
                </div>
                <div class="flex mb-4">
                    <div class="w-20">标识</div>
                    <div>
                        <span class="mr-2 text-sm bg-gray-100 px-2 leading-6 inline-block rounded-lg">
                            {{ props.record.name }}
                        </span>
                    </div>
                </div>
                <div class="flex mb-4">
                    <div class="w-20">服务</div>
                    <div class="">
                        <div v-if="props.record.runtime?.httpUrl" class="font-mono text-sm">
                            {{ props.record.runtime?.httpUrl }}
                        </div>
                        <div v-else class="text-gray-400 text-sm">
                            未启动
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a-modal>
</template>
