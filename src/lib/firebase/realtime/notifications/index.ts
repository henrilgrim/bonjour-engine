import { onValue, off, update } from "firebase/database";
import { rtdbRefs } from "..";
import { registerRealtimeListener } from "../listeners";
import type { Notification, NotificationReadStatus } from "./types";

export * from "./types";

/**
 * Marca uma notificação como lida por um agente
 */
export async function markNotificationAsRead(
    accountcode: string,
    notificationId: string,
    agentLogin: string,
    agentName: string
): Promise<void> {
    const notificationRef = rtdbRefs.notification(accountcode, notificationId);

    const readStatus: NotificationReadStatus = {
        readAt: Date.now(),
        agentLogin,
        agentName,
    };

    await update(notificationRef, {
        [`readBy/${agentLogin}`]: readStatus,
    });
}

/**
 * Escuta notificações para um agente específico
 */
/**
 * Escuta notificações não lidas de um agente específico
 */
export function listenAgentNotifications(
    accountcode: string,
    agentLogin: string,
    callback: (notifications: Notification[]) => void
): () => void {
    const notificationsRef = rtdbRefs.notifications(accountcode);

    const listener = (snapshot: any) => {
        const data = snapshot.val();
        if (!data) {
            callback([]);
            return;
        }

        const allNotifications: Notification[] = Object.values(data);

        console.log("allNotifications", allNotifications);

        // Filtrar apenas notificações não lidas pelo agente
        const agentNotifications = allNotifications.filter((notification) => {
            const agentLoginString = agentLogin.toString();

            const targeted =
                notification.targetAgents.includes(agentLoginString);
            const alreadyRead = !!notification.readBy?.[agentLoginString];
            return targeted && !alreadyRead;
        });

        console.log("agentLogin", agentLogin);
        console.log("agentNotifications", agentNotifications);

        callback(agentNotifications);
    };

    onValue(notificationsRef, listener);

    const unsub = () => off(notificationsRef, "value", listener);
    registerRealtimeListener(unsub);

    return unsub;
}
