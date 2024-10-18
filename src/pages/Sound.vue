<script setup lang="ts">

import {t} from "../lang";
import {ref} from "vue";
import SoundTts from "./Sound/SoundTts.vue";
import SoundClone from "./Sound/SoundClone.vue";

const tab = ref('soundTts');

</script>

<template>
    <div class="pb-device-container h-full relative select-none flex">
        <div class="p-5 w-52 flex-shrink-0 border-r border-solid border-gray-100">
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="tab === 'soundTts' ? 'bg-gray-100' : ''"
                 @click="tab = 'soundTts'">
                <div class="text-base">
                    <i class="iconfont icon-sound-generate"></i>
                    {{ t('声音合成') }}
                </div>
            </div>
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="tab === 'soundClone' ? 'bg-gray-100' : ''"
                 @click="tab = 'soundClone'">
                <div class="text-base">
                    <i class="iconfont icon-sound-clone"></i>
                    {{ t('声音克隆') }}
                </div>
            </div>
        </div>
        <div class="flex-grow h-full overflow-y-auto">
            <SoundTts v-if="tab === 'soundTts'"/>
            <SoundClone v-else-if="tab === 'soundClone'"/>
        </div>
    </div>
</template>

<style scoped>

</style>
