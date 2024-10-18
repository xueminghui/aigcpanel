<script setup lang="ts">
import {computed, ref} from "vue";
import {Dialog} from "../../lib/dialog";
import {t} from "../../lang";
import {functionToLabels, mapError} from "../../lib/aigcpanel";

const visible = ref(false)
const loading = ref(false)
const modelInfo = ref({
    name: '',
    version: '',
    title: '',
    description: '',
    path: '',
    platformName: '',
    platformArch: '',
    entry: '',
    functions: [],
})
const isImporting = ref(false)
const logStatus = ref('')

const show = () => {
    emptyModelInfo()
    visible.value = true
}

const platformInfo = computed(() => {
    return `${modelInfo.value.platformName} ${modelInfo.value.platformArch}`
})
const functionLabels = computed(() => {
    return functionToLabels(modelInfo.value.functions)
})

const emptyModelInfo = () => {
    modelInfo.value.name = ''
    modelInfo.value.version = ''
    modelInfo.value.title = ''
    modelInfo.value.description = ''
    modelInfo.value.path = ''
}

const doSubmit = async () => {
    if (!modelInfo.value.path) {
        Dialog.tipError(t('请选择模型文件'))
        return
    }
    const target = await window.$mapi.file.fullPath(`model/${modelInfo.value.name}-${modelInfo.value.version}`)
    const targetAbsolute = window.$mapi.file.absolutePath(target)
    if (await window.$mapi.file.exists(targetAbsolute)) {
        Dialog.tipError('模型相同版本已存在')
        return
    }
    if (window.$mapi.app.platformName() !== modelInfo.value.platformName) {
        Dialog.tipError(t('模型平台不匹配'))
        return
    }
    if (window.$mapi.app.platformArch() !== modelInfo.value.platformArch) {
        Dialog.tipError(t('模型架构不匹配'))
        return
    }
    isImporting.value = true
    logStatus.value = t('正在解压文件')
    try {
        await window.$mapi.misc.unzip(modelInfo.value.path, target, {
            process: (type: string, file: any) => {
                switch (type) {
                    case 'start':
                        // logAppend(t('正在解压 {name}', {name: file.fileName}))
                        break
                    case 'end':
                        break
                    default:
                        console.error('unzip', type, file)
                        break
                }
            },
        })
        // console.log('entry', modelInfo.value.entry)
        if (modelInfo.value.entry) {
            const executable = target + '/' + modelInfo.value.entry
            const executableAbsolute = window.$mapi.file.absolutePath(executable)
            // console.log('executable', executable)
            if (await window.$mapi.file.exists(executableAbsolute)) {
                await window.$mapi.app.fixExecutable(executable)
                // console.log('fixExecutable', executable)
            }
        }
    } catch (e) {
        console.error('ServerImportLocalDialog.doSubmit.error', e)
        Dialog.tipError(mapError(e))
        isImporting.value = false
        return
    }
    logStatus.value = t('文件解压完成')
    Dialog.tipSuccess('模型文件导入成功')
    visible.value = false
    isImporting.value = false
    emit('update')
}

const doSelectFile = async () => {
    const serverPath = await window.$mapi.file.openFile()
    if (!serverPath) {
        return
    }
    emptyModelInfo()
    visible.value = true
    loading.value = true
    try {
        const content = await window.$mapi.misc.getZipFileContent(serverPath, 'config.json')
        const json = JSON.parse(content)
        modelInfo.value.name = json.name || ''
        modelInfo.value.version = json.version || ''
        modelInfo.value.title = json.title || ''
        modelInfo.value.description = json.description || ''
        modelInfo.value.path = serverPath
        modelInfo.value.platformName = json.platformName || ''
        modelInfo.value.platformArch = json.platformArch || ''
        modelInfo.value.entry = json.entry || ''
        modelInfo.value.functions = json.functions || []
        logStatus.value = ''
    } catch (e) {
        console.log('ServerImportLocalDialog.doSelectFile.error', e)
        Dialog.tipError('模型文件解析失败，请选择正确的模型文件')
    }
    loading.value = false
}
defineExpose({
    show,
    doSelectFile
})

const emit = defineEmits({
    update: () => true
})

</script>

<template>
    <a-modal v-model:visible="visible"
             width="40rem"
             :footer="false"
             :esc-to-close="false"
             :mask-closable="false"
             title-align="start">
        <template #title>
            {{ $t('导入本地模型') }}
        </template>
        <div>
            <div class="">
                <div v-if="!modelInfo.name">
                    <a-button @click="doSelectFile"
                              class="block w-full"
                              :loading="loading">
                        <template #icon>
                            <icon-file/>
                        </template>
                        {{ t('选择模型文件') }}
                    </a-button>
                </div>
                <div v-else>
                    <div class="border rounded-lg py-4 leading-10">
                        <div class="flex">
                            <div class="pr-3 text-right w-20">{{ t('名称') }}</div>
                            <div>{{ modelInfo.title }}</div>
                        </div>
                        <div class="flex">
                            <div class="pr-3 text-right w-20">{{ t('版本') }}</div>
                            <div>{{ modelInfo.version }}</div>
                        </div>
                        <div class="flex">
                            <div class="pr-3 text-right w-20">{{ t('标识') }}</div>
                            <div>{{ modelInfo.name }}</div>
                        </div>
                        <div class="flex">
                            <div class="pr-3 text-right w-20 flex-shrink-0">{{ t('描述') }}</div>
                            <div>{{ modelInfo.description }}</div>
                        </div>
                        <div class="flex">
                            <div class="pr-3 text-right w-20 flex-shrink-0">适配</div>
                            <div>{{ platformInfo }}</div>
                        </div>
                        <div class="flex">
                            <div class="pr-3 text-right w-20 flex-shrink-0">功能</div>
                            <div>
                                <a-tag v-for="label in functionLabels" class="mr-1">
                                    {{ label }}
                                </a-tag>
                            </div>
                        </div>
                    </div>
                    <div class="pt-4 flex items-center">
                        <div>
                            <a-button class="mr-2" type="primary"
                                      :loading="isImporting"
                                      @click="doSubmit">
                                <template #icon>
                                    <icon-check/>
                                </template>
                                确认导入
                            </a-button>
                            <a-button class="mr-2"
                                      v-if="!isImporting"
                                      @click="doSelectFile" :loading="loading">
                                <template #icon>
                                    <icon-upload/>
                                </template>
                                重新选择
                            </a-button>
                        </div>
                        <div class="flex-grow pl-3">
                            {{ logStatus }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a-modal>
</template>

