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
 * Cria uma nova notificação
 */
export async function createNotification(
    accountcode: string,
    notification: NotificationInput,
    createdBy: string,
    createdByName: string
): Promise<string> {
    const notificationsRef = getNotificationsCollection(accountcode);

    const notificationData: Omit<Notification, "id"> = {
        title: notification.title,
        message: notification.message,
        targetAgents: notification.targetAgents,
        createdBy,
        createdByName,
        createdAt: Date.now(),
        readBy: {},
    };

    const docRef = await addDoc(notificationsRef, notificationData);
    return docRef.id;
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
 * Escuta todas as notificações em tempo real
 */
export function listenAllNotifications(
    accountcode: string,
    callback: (notifications: Notification[]) => void
): () => void {
    const notificationsRef = getNotificationsCollection(accountcode);
    const q = query(notificationsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
            const notifications: Notification[] = [];

            snapshot.forEach((doc) => {
                notifications.push({
                    id: doc.id,
                    ...doc.data(),
                } as Notification);
            });

            callback(notifications);
        },
        (error) => {
            console.error("Erro ao escutar notificações:", error);
            callback([]);
        }
    );

    return unsubscribe;
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
        where("targetAgents", "array-contains", agentLogin),
        orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
            const notifications: Notification[] = [];

            snapshot.forEach((doc) => {
                notifications.push({
                    id: doc.id,
                    ...doc.data(),
                } as Notification);
            });

            callback(notifications);
        },
        (error) => {
            console.error("Erro ao escutar notificações do agente:", error);
            callback([]);
        }
    );

    return unsubscribe;
}
