import {t} from "../lang";

export function functionToLabels(functions: string[]) {
    const map = {
        'soundTts': '语音合成',
        'soundClone': '声音克隆',
    }
    return (functions || []).map(f => map[f] || f)
}

export function mapError(msg: any) {
    if (typeof msg !== 'string') {
        msg = msg.toString()
    }
    const map = {
        'FileAlreadyExists': t('文件已存在'),
        'FileNotFound': t('文件未找到'),
        'ProcessTimeout': t('处理超时'),
        'RequestError': t('请求错误'),
        'ServerNotRunning': t('模型服务未运行'),
    }
    for (let key in map) {
        if (msg.includes(key)) {
            return map[key]
        }
    }
    return msg
}
