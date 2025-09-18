import {
    collection,
    doc,
    addDoc,
    updateDoc,
    onSnapshot,
    query,
    orderBy,
    where,
} from "firebase/firestore";
import type {
    Notification,
    NotificationInput,
    NotificationReadStatus,
} from "./types";
import { getManagerPanelDoc } from "..";

export * from "./types";

export function getNotificationsCollection(accountcode: string) {
    return collection(getManagerPanelDoc(accountcode), "notifications");
}

export function getNotificationDoc(
    accountcode: string,
    notificationId: string
) {
    return doc(getNotificationsCollection(accountcode), notificationId);
}

/**
 * Marca uma notificação como lida por um agente
 */
export async function markNotificationAsRead(
    accountcode: string,
    notificationId: string,
    agentLogin: string,
    agentName: string
): Promise<void> {
    const notificationRef = getNotificationDoc(accountcode, notificationId);

    const readStatus: NotificationReadStatus = {
        readAt: Date.now(),
        agentLogin,
        agentName,
    };

    await updateDoc(notificationRef, {
        [`readBy.${agentLogin}`]: readStatus,
    });
}

/**
 * Escuta notificações para um agente específico
 */
export function listenAgentNotifications(
    accountcode: string,
    agentLogin: string,
    callback: (notifications: Notification[]) => void
): () => void {
    const notificationsRef = getNotificationsCollection(accountcode);
    const q = query(
        notificationsRef,
        where("targetAgents", "array-contains", agentLogin.toString()),
        orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
            const unreadNotifications: Notification[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data() as Notification;

                const hasRead =
                    data.readBy &&
                    typeof data.readBy === "object" &&
                    String(agentLogin) in data.readBy;

                if (!hasRead) {
                    unreadNotifications.push({
                        id: doc.id,
                        ...data,
                    });
                }
            });

            callback(unreadNotifications);
        },
        (error) => {
            console.error("Erro ao escutar notificações do agente:", error);
            callback([]);
        }
    );

    return unsubscribe;
}
