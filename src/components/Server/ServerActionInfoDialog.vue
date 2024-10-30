<script setup lang="ts">
import {EnumServerType, ServerRecord} from "../../types/Server";
import {ref} from "vue";
import {functionToLabels} from "../../lib/aigcpanel";
import {useServerStore} from "../../store/modules/server";

const serverStore = useServerStore()
const props = defineProps<{
    record: ServerRecord,
}>()

const httpUrl = ref('')
const visible = ref(false)

const show = async () => {
    visible.value = true
    const serverInfo = await serverStore.serverInfo(props.record)
    const res = await window.$mapi.server.config(serverInfo)
    httpUrl.value = res.data?.httpUrl || ''
}

const doOpenHttpUrl = () => {
    if (httpUrl.value) {
        window.$mapi.app.openExternalWeb(httpUrl.value)
    }
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
                    <div class="w-20">{{ $t('类型') }}</div>
                    <div>
                        <span v-if="record.type===EnumServerType.LOCAL">
                            <i class="iconfont icon-desktop mr-1"></i>
                            {{ $t('本地模型') }}
                        </span>
                        <span v-else-if="record.type===EnumServerType.LOCAL_DIR">
                            <i class="iconfont icon-folder mr-1"></i>
                            {{ $t('本地模型目录') }}
                        </span>
                        <span v-else-if="record.type===EnumServerType.REMOTE">
                            <i class="iconfont icon-network mr-1"></i>
                            {{ $t('远程模型') }}
                        </span>
                    </div>
                </div>
                <div class="flex mb-4">
                    <div class="w-20">{{ $t('模型') }}</div>
                    <div>
                        {{ props.record.title }}
                    </div>
                </div>
                <div class="flex mb-4" v-if="record.type===EnumServerType.LOCAL_DIR">
                    <div class="w-20 flex-shrink-0">{{ $t('目录') }}</div>
                    <div>
                        <div class="rounded py-1 px-2 text-sm bg-gray-100">
                            {{ props.record.localPath }}
                        </div>
                    </div>
                </div>
                <div class="flex mb-4">
                    <div class="w-20">{{ $t('版本') }}</div>
                    <div>
                        <a-tag>
                            v{{ props.record.version }}
                        </a-tag>
                    </div>
                </div>
                <div class="flex mb-4">
                    <div class="w-20">{{ $t('功能') }}</div>
                    <div>
                        <a-tag v-for="label in functionToLabels(record.functions)" class="mr-1">
                            {{ label }}
                        </a-tag>
                    </div>
                </div>
                <div class="flex mb-4">
                    <div class="w-20">{{ $t('标识') }}</div>
                    <div>
                        <span class="mr-2 text-sm bg-gray-100 px-2 leading-6 inline-block rounded-lg">
                            {{ props.record.name }}
                        </span>
                    </div>
                </div>
                <div class="flex mb-4">
                    <div class="w-20">{{ $t('服务') }}</div>
                    <div class="">
                        <div v-if="httpUrl" class="font-mono">
                            <div class="inline-block mr-2">
                                {{ httpUrl }}
                            </div>
                            <a-button size="mini" @click="doOpenHttpUrl">
                                <template #icon>
                                    <icon-link/>
                                </template>
                            </a-button>
                        </div>
                        <div v-else class="text-gray-400 text-sm leading-7">
                            {{ $t('未启动') }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a-modal>
</template>
