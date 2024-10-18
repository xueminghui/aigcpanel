<script setup lang="ts">
import {ServerRecord} from "../../types/Server";
import LogViewerDialog from "../common/LogViewerDialog.vue";
import {ref} from "vue";

const viewerDialog = ref<InstanceType<typeof LogViewerDialog> | null>(null)
const props = defineProps<{
    record: ServerRecord,
}>()

</script>

<template>
    <a-tooltip :content="$t('日志')">
        <a-button class="mr-2"
                  @click="viewerDialog?.show()"
                  :disabled="!record.runtime?.logFile">
            <template #icon>
                <icon-file/>
            </template>
        </a-button>
    </a-tooltip>
    <LogViewerDialog ref="viewerDialog" :log-file="record.runtime?.logFile"/>
</template>
