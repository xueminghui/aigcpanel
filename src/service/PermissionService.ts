import {useServerStore} from "../store/modules/server";
import {EnumServerType} from "../types/Server";
import {Dialog} from "../lib/dialog";

const serverStore = useServerStore()
export const PermissionService = {
    async checkForTask(biz: string, data: {
        serverName: string,
        serverVersion: string,
    }) {
        const server = await serverStore.getByNameVersion(
            data.serverName,
            data.serverVersion
        )
        if (!server) {
            throw 'ServerNotFound'
        }
        if (server.type === EnumServerType.CLOUD) {
            const user = await window.$mapi.user.get()
            if (!user.user.id) {
                window.$mapi.user.open().then()
                return false
            }
            const res = await window.$mapi.user.apiPost('aigcpanel/task/check', {
                model: data.serverName,
                version: data.serverVersion,
            }, {
                catchException: false
            })
            if (res.code) {
                Dialog.tipError(res.msg)
                return false
            }
        }
        return true
    }
}
