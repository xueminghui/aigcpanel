<script setup lang="ts">

import VideoTemplateDialog from "../../components/Video/VideoTemplateDialog.vue";
import {onBeforeUnmount, onMounted, ref} from "vue";
import VideoGenCreate from "../../components/Video/VideoGenCreate.vue";
import {VideoGenRecord, VideoGenService} from "../../service/VideoGenService";
import {TaskChangeType, useTaskStore} from "../../store/modules/task";
import VideoGenActionDownload from "../../components/Video/VideoGenActionDownload.vue";
import TaskBizStatus from "../../components/common/TaskBizStatus.vue";
import VideoGenActionDelete from "../../components/Video/VideoGenActionDelete.vue";
import VideoPlayer from "../../components/common/VideoPlayer.vue";
import VideoDuration from "../../components/Video/VideoDuration.vue";

const videoTemplateDialog = ref<InstanceType<typeof VideoTemplateDialog> | null>(null)

const records = ref<VideoGenRecord[]>([])
const taskStore = useTaskStore()

const doRefresh = async () => {
    records.value = await VideoGenService.list()
}

const taskChangeCallback = (bizId: string, type: TaskChangeType) => {
    setTimeout(doRefresh, 1000)
}

onMounted(async () => {
    await doRefresh()
    taskStore.onChange('VideoGen', taskChangeCallback)
})
onBeforeUnmount(() => {
    taskStore.offChange('VideoGen', taskChangeCallback)
})

</script>

<template>
    <div class="p-5">
        <div class="mb-4 flex items-center">
            <div class="text-3xl font-bold flex-grow">
                {{ $t('视频合成') }}
            </div>
            <div class="flex items-center">
                <a-button class="ml-1"
                          @click="videoTemplateDialog?.show()">
                    <template #icon>
                        <i class="iconfont icon-video-template"></i>
                    </template>
                    {{ $t('视频模板') }}
                </a-button>
                <a-tooltip v-if="0"
                           :content="$t('清空历史')" position="right">
                    <a-button class="ml-1">
                        <template #icon>
                            <icon-delete/>
                        </template>
                    </a-button>
                </a-tooltip>
            </div>
        </div>
        <div>
            <VideoGenCreate @submitted="doRefresh"/>

            <div>
                <div v-for="r in records" :key="r.id">
                    <div class="rounded-xl shadow border p-4 mt-4 hover:shadow-lg">
                        <div class="flex items-center">
                            <div class="flex-grow flex items-center">
                                <div class="inline-block mr-4 bg-blue-100 rounded-lg px-2 leading-8 h-8">
                                    #{{ r.id }}
                                </div>
                                <div class="inline-block mr-4 bg-blue-100 rounded-lg px-2 leading-8 h-8">
                                    <i class="iconfont icon-server mr-1"></i>
                                    {{ r.serverTitle }}
                                    v{{ r.serverVersion }}
                                </div>
                            </div>
                            <div class="ml-1">
                                <VideoDuration :start="r.startTime" :end="r.endTime"/>
                            </div>
                            <div class="ml-1">
                                <TaskBizStatus :status="r.status" :status-msg="r.statusMsg"/>
                            </div>
                        </div>
                        <div class="pt-4">
                            <pre>{{ r }}</pre>
                        </div>
                        <div class="pt-4" v-if="r.resultMp4">
                            <VideoPlayer
                                show-wave
                                :url="'file://'+r.resultMp4"/>
                        </div>
                        <div class="pt-4">
                            <VideoGenActionDownload :record="r"/>
                            <VideoGenActionDelete :record="r" @update="doRefresh"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <VideoTemplateDialog ref="videoTemplateDialog"/>
</template>

<style scoped>

</style>
