<script setup lang="ts">
import {computed, ref} from "vue";
import {Dialog} from "../../lib/dialog";
import {t} from "../../lang";
import {functionToLabels} from "../../lib/aigcpanel";
import {mapError} from "../../lib/error";
import {EnumServerType, ServerRecord} from "../../types/Server";
import {useServerStore} from "../../store/modules/server";

const serverStore = useServerStore()
const visible = ref(false)
const loading = ref(false)
const modelInfo = ref({
    type: EnumServerType.LOCAL as EnumServerType,
    name: '',
    version: '',
    title: '',
    description: '',
    path: '',
    platformName: '',
    platformArch: '',
    entry: '',
    functions: [],
    settings: [],
    setting: {},
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
    modelInfo.value.type = EnumServerType.LOCAL
    modelInfo.value.name = ''
    modelInfo.value.version = ''
    modelInfo.value.title = ''
    modelInfo.value.description = ''
    modelInfo.value.path = ''
    modelInfo.value.platformName = ''
    modelInfo.value.platformArch = ''
    modelInfo.value.entry = ''
    modelInfo.value.functions = []
    modelInfo.value.settings = []
    modelInfo.value.setting = {}
}

const doSubmitLocal = async (target: string) => {
    logStatus.value = t('正在解压文件')
    try {
        // console.log('unzip.start', modelInfo.value.path, target)
        await window.$mapi.misc.unzip(modelInfo.value.path, target, {
            process: (type: string, file: any) => {
                switch (type) {
                    case 'start':
                        logStatus.value = t('正在解压 {name}', {name: file.fileName})
                        break
                    case 'end':
                        break
                    default:
                        console.error('unzip', type, file)
                        break
                }
            },
        })
        // console.log('unzip.end', modelInfo.value.path, target)
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
}

const doSubmitLocalDir = async () => {
    await serverStore.add({
        key: serverStore.generateServerKey({
            name: modelInfo.value.name,
            version: modelInfo.value.version,
        } as any),
        name: modelInfo.value.name,
        title: modelInfo.value.title,
        version: modelInfo.value.version,
        type: modelInfo.value.type,
        functions: modelInfo.value.functions,
        localPath: modelInfo.value.path,
        settings: modelInfo.value.settings,
        setting: modelInfo.value.setting,
    } as ServerRecord)
}

const doSubmit = async () => {
    if (!modelInfo.value.path) {
        return
    }
    const target = await window.$mapi.file.fullPath(`model/${modelInfo.value.name}-${modelInfo.value.version}`)
    const targetAbsolute = window.$mapi.file.absolutePath(target)
    if (await window.$mapi.file.exists(targetAbsolute)) {
        Dialog.tipError(t('模型相同版本已存在'))
        return
    }
    const exists = await serverStore.getByNameVersion(modelInfo.value.name, modelInfo.value.version)
    if (exists) {
        Dialog.tipError(t('模型相同版本已存在'))
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
    if (modelInfo.value.type === EnumServerType.LOCAL) {
        await doSubmitLocal(target)
    } else if (modelInfo.value.type === EnumServerType.LOCAL_DIR) {
        await doSubmitLocalDir()
    } else {
        Dialog.tipError(t('模型类型错误'))
        return
    }
    Dialog.tipSuccess(t('模型添加成功'))
    visible.value = false
    isImporting.value = false
    emit('update')
}

const doSelectFileDir = async () => {
    const serverPath = await window.$mapi.file.openDirectory()
    if (!serverPath) {
        return
    }
    emptyModelInfo()
    loading.value = true
    try {
        const content = await window.$mapi.file.read(serverPath + '/config.json', {
            isFullPath: true
        })
        const json = JSON.parse(content)
        modelInfo.value.type = EnumServerType.LOCAL_DIR
        modelInfo.value.name = json.name || ''
        modelInfo.value.version = json.version || ''
        modelInfo.value.title = json.title || ''
        modelInfo.value.description = json.description || ''
        modelInfo.value.path = serverPath
        modelInfo.value.platformName = json.platformName || ''
        modelInfo.value.platformArch = json.platformArch || ''
        modelInfo.value.entry = json.entry || ''
        modelInfo.value.functions = json.functions || []
        modelInfo.value.settings = json.settings || {}
        modelInfo.value.setting = json.setting || {}
        logStatus.value = ''
    } catch (e) {
        console.log('ServerImportLocalDialog.doSelectFileDir.error', e)
        Dialog.tipError(t('模型目录识别失败，请选择正确的模型目录'))
    }
    loading.value = false
}

const doSelectFile = async () => {
    const serverPath = await window.$mapi.file.openFile()
    if (!serverPath) {
        return
    }
    emptyModelInfo()
    loading.value = true
    try {
        const content = await window.$mapi.misc.getZipFileContent(serverPath, 'config.json')
        const json = JSON.parse(content)
        modelInfo.value.type = EnumServerType.LOCAL
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
        Dialog.tipError(t('模型文件解析失败，请选择正确的模型文件'))
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
            {{ $t('添加模型服务') }}
        </template>
        <div>
            <div class="">
                <div v-if="!modelInfo.name">
                    <div class="">
                        <div v-if="0" class="w-1/2 px-3">
                            <div>
                                <img class="w-32 h-32 object-contain m-auto"
                                     src="./../../assets/image/server-file.svg"/>
                            </div>
                            <div>
                                <a-button @click="doSelectFile"
                                          class="block w-full"
                                          :loading="loading">
                                    <template #icon>
                                        <icon-file/>
                                    </template>
                                    {{ t('选择模型ZIP文件') }}
                                </a-button>
                            </div>
                            <div class="mt-3 text-sm text-gray-400 rounded-lg">
                                {{ $t('模型一键启动压缩包，包含模型服务的配置文件和模型服务程序文件。')}}
                            </div>
                        </div>
                        <div class="px-3">
                            <div>
                                <img class="w-32 h-32 object-contain m-auto"
                                     src="./../../assets/image/server-folder.svg"/>
                            </div>
                            <div>
                                <a-button @click="doSelectFileDir"
                                          class="block w-full"
                                          :loading="loading">
                                    <template #icon>
                                        <icon-folder/>
                                    </template>
                                    {{ t('选择模型服务目录') }}
                                </a-button>
                            </div>
                            <div class="mt-3 text-sm text-gray-400 rounded-lg">
                                {{ $t('模型服务目录，包含模型服务的配置文件和模型服务程序文件。' )}}
                            </div>
                        </div>
                    </div>
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
                            <div class="pr-3 text-right w-20 flex-shrink-0">{{ $t('适配') }}</div>
                            <div>{{ platformInfo }}</div>
                        </div>
                        <div class="flex">
                            <div class="pr-3 text-right w-20 flex-shrink-0">{{ $t('功能') }}</div>
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
                                {{ $t('确认提交') }}
                            </a-button>
                            <a-button class="mr-2"
                                      v-if="!isImporting"
                                      @click="emptyModelInfo"
                                      :loading="loading">
                                <template #icon>
                                    <icon-redo/>
                                </template>
                                {{ $t('重新选择') }}
                            </a-button>
                        </div>
                        <div class="flex-grow pl-3 text-sm truncate">
                            {{ logStatus }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a-modal>
</template>

