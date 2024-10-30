<script setup lang="ts">

import VideoTemplateDialog from "../../components/Video/VideoTemplateDialog.vue";
import {ref} from "vue";

const videoTemplateDialog = ref<InstanceType<typeof VideoTemplateDialog>>(null)
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
        </div>
    </div>
    <VideoTemplateDialog ref="videoTemplateDialog"/>
</template>

<style scoped>

</style>
