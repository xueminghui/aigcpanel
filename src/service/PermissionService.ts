import {useServerStore} from "../store/modules/server";
import {EnumServerType} from "../types/Server";

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
        }
        return true
    }
}
