import {t} from "../lang";

export function functionToLabels(functions: string[]) {
    const map = {
        'soundTts': '语音合成',
        'soundClone': '声音克隆',
    }
    return (functions || []).map(f => map[f] || f)
}
