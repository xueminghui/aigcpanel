<script setup lang="ts">
import {useServerStore} from "../../store/modules/server";
import {EnumServerStatus} from "../../types/Server";

const serverStore = useServerStore()

const props = defineProps<{
    functionName: string
}>()

</script>

<template>
    <a-select :placeholder="$t('选择模型')" size="small">
        <a-option v-for="server in serverStore.records.filter(s => s.functions.includes(props.functionName))"
                  :key="server.key"
                  :value="server.key">
            <div class="flex items-center py-2 flex-nowrap truncate no-wrap">
                <div v-if="server.status===EnumServerStatus.RUNNING" class="inline-block w-2 h-2 bg-green-700 rounded-full mr-1"></div>
                <div v-else class="inline-block w-2 h-2 bg-red-700 rounded-full mr-1"></div>
                <div class="text-xs flex-grow">
                    {{ server.title }}
                    v{{ server.version }}
                </div>
            </div>
        </a-option>
        <template #label="{ data }">
            <span class="text-sm">{{ data?.label }}</span>
        </template>
    </a-select>
</template>
