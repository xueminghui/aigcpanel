import {net} from 'electron'
import {Client, handle_file} from "@gradio/client";
import {isWin, platformArch, platformName, platformUUID} from "../../lib/env";
import {Events} from "../event/main";
import {Apps} from "../app";
import {Files} from "../file/main";
import fs from 'node:fs'
import User, {UserApi} from "../user/main";

const request = async (url, data?: {}, option?: {}) => {
    option = Object.assign({
        method: 'GET',
        timeout: 60 * 1000,
        headers: {
            'Content-Type': 'application/json'
        },
        responseType: 'json' as 'json'
    })
    if (option['method'] === 'GET') {
        url += '?'
        for (let key in data) {
            url += `${key}=${data[key]}&`
        }
    }
    return new Promise((resolve, reject) => {
        const req = net.request({
            url,
            method: option['method'],
            headers: option['headers'],
        })
        req.on('response', (response) => {
            let body = ''
            response.on('data', (chunk) => {
                body += chunk.toString()
            })
            response.on('end', () => {
                if ('json' === option['responseType']) {
                    try {
                        resolve(JSON.parse(body))
                    } catch (e) {
                        resolve({code: -1, msg: `ResponseError: ${body}`})
                    }
                } else {
                    resolve(body)
                }
            })
        })
        req.on('error', (err) => {
            reject(err)
        })
        req.end()
    })
}

const requestPost = async (url, data?: {}, option?: {}) => {
    option = Object.assign({
        method: 'POST',
    })
    return request(url, data, option)
}

const requestGet = async (url, data?: {}, option?: {}) => {
    option = Object.assign({
        method: 'GET',
    })
    return request(url, data, option)
}

const requestPostSuccess = async (url, data?: {}, option?: {}) => {
    const res = await requestPost(url, data, option)
    if (res['code'] === 0) {
        return res
    }
    throw new Error(res['msg'])
}

const requestUrlFileToLocal = async (url, path) => {
    return new Promise((resolve, reject) => {
        const req = net.request(url)
        req.on('response', (response) => {
            const file = fs.createWriteStream(path)
            // @ts-ignore
            response.pipe(file)
            file.on('finish', () => {
                file.close()
                resolve('x')
            })
        })
        req.on('error', (err) => {
            reject(err)
        })
        req.end()
    })
}

const requestEventSource = async (url: string, param: any, option?: {
    method?: 'POST' | 'GET',
    headers?: Record<string, string>,
    onMessage: (data: any) => void,
    onEnd?: () => void,
}) => {
    option = Object.assign({
        method: 'POST',
        headers: {},
        onMessage: (data: any) => {
            console.log('onMessage', data)
        },
        onEnd: () => {
            console.log('onEnd')
        }
    }, option)
    const response = await fetch(url, {
        method: option.method,
        headers: {
            'Content-Type': 'application/json',
            ...option.headers,
        },
        body: JSON.stringify(param || {}),
    });
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
        const {done, value} = await reader.read();
        if (done) {
            break;
        }
        buffer += decoder.decode(value, {stream: true});
        const lines = buffer.split("\n");
        buffer = lines.pop()
        // console.log('fetchEventSource', JSON.stringify(buffer))
        for (const line of lines) {
            // console.log('line', JSON.stringify(line))
            if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if ('[END]' === data) {
                    option.onEnd()
                    return;
                }
                const eventData = line.slice(6).trim();
                option.onMessage(JSON.parse(eventData))
            }
        }
    }
}

const env = async () => {
    const result = {}
    result['AIGCPANEL_SERVER_API_TOKEN'] = await User.getApiToken()
    result['AIGCPANEL_SERVER_API_KEY'] = ''
    result['AIGCPANEL_SERVER_UUID'] = platformUUID()
    result['AIGCPANEL_SERVER_LAUNCHER_MODE'] = 'gui'
    return result
}

export default {
    GradioClient: Client,
    GradioHandleFile: handle_file,
    event: Events,
    file: Files,
    app: Apps,
    request,
    requestPost,
    requestGet,
    requestPostSuccess,
    requestUrlFileToLocal,
    requestEventSource,
    platformName: platformName(),
    platformArch: platformArch(),
    env,
}
