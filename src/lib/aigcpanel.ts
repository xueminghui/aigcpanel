import {t} from "../lang";

export function functionToLabels(functions: string[]) {
    const map = {
        'soundTts': t('语音合成'),
        'soundClone': t('声音克隆'),
        'videoGen': t('视频生成'),
    }
    return (functions || []).map(f => map[f] || f)
}
