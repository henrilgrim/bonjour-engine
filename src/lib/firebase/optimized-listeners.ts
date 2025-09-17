import { onSnapshot, query, orderBy } from "firebase/firestore";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase/database";
import { firebaseListenersPool, createListenerKey } from "./listeners-pool";
import { rtdbRefs } from "./realtime";
import { getMessagesCollection } from "./firestore/chats";
import { getNotificationsCollection } from "./firestore/notifications";
import { listenAgents } from "./realtime/online";
import type { ChatMessage } from "./firestore/chats/types";
import type { Notification } from "./firestore/notifications/types";

/**
 * Listener otimizado para filas da empresa
 */
export function useOptimizedCompanyQueues(
    accountcode: string,
    callback: (queues: { id: string; data: any }[]) => void,
    errorCallback?: (error: unknown) => void
): () => void {
    if (!accountcode) return () => {};

    const key = createListenerKey("company-queues", accountcode);

    return firebaseListenersPool.addListener(
        key,
        () => {
            const baseRef = rtdbRefs.queueMemberStatus(accountcode);
            const queues: Record<string, any> = {};

            const emit = () => {
                const arr = Object.entries(queues).map(([id, data]) => ({ id, data }));
                firebaseListenersPool.updateData(key, arr);
            };

            const unsubs = [
                onChildAdded(baseRef, (snap) => {
                    queues[snap.key!] = snap.val();
                    emit();
                }, (e) => firebaseListenersPool.broadcastError(key, e)),

                onChildChanged(baseRef, (snap) => {
                    queues[snap.key!] = snap.val();
                    emit();
                }, (e) => firebaseListenersPool.broadcastError(key, e)),

                onChildRemoved(baseRef, (snap) => {
                    delete queues[snap.key!];
                    emit();
                }, (e) => firebaseListenersPool.broadcastError(key, e))
            ];

            return () => unsubs.forEach(u => u());
        },
        callback,
        errorCallback
    );
}

/**
 * Listener otimizado para totalizadores de filas
 */
export function useOptimizedCompanyTotalizers(
    accountcode: string,
    callback: (queues: { id: string; data: any }[]) => void,
    errorCallback?: (error: unknown) => void
): () => void {
    if (!accountcode) return () => {};

    const key = createListenerKey("company-totalizers", accountcode);

    return firebaseListenersPool.addListener(
        key,
        () => {
            const baseRef = rtdbRefs.totalizadoresByQueue(accountcode);
            const queues: Record<string, any> = {};

            const emit = () => {
                const arr = Object.entries(queues).map(([id, data]) => ({ id, data }));
                firebaseListenersPool.updateData(key, arr);
            };

            const unsubs = [
                onChildAdded(baseRef, (snap) => {
                    queues[snap.key!] = snap.val();
                    emit();
                }, (e) => firebaseListenersPool.broadcastError(key, e)),

                onChildChanged(baseRef, (snap) => {
                    queues[snap.key!] = snap.val();
                    emit();
                }, (e) => firebaseListenersPool.broadcastError(key, e)),

                onChildRemoved(baseRef, (snap) => {
                    delete queues[snap.key!];
                    emit();
                }, (e) => firebaseListenersPool.broadcastError(key, e))
            ];

            return () => unsubs.forEach(u => u());
        },
        callback,
        errorCallback
    );
}

/**
 * Listener otimizado para agentes online
 */
export function useOptimizedAgentsOnline(
    accountcode: string,
    callback: (agents: any[]) => void,
    errorCallback?: (error: unknown) => void
): () => void {
    if (!accountcode) return () => {};

    const key = createListenerKey("agents-online", accountcode);

    return firebaseListenersPool.addListener(
        key,
        () => {
            return listenAgents(
                accountcode,
                (agents) => firebaseListenersPool.updateData(key, agents),
                (error) => firebaseListenersPool.broadcastError(key, error)
            );
        },
        callback,
        errorCallback
    );
}

/**
 * Listener otimizado para mensagens de chat (com cache inteligente)
 */
export function useOptimizedChatMessages(
    accountcode: string,
    chatId: string,
    callback: (messages: ChatMessage[]) => void,
    errorCallback?: (error: unknown) => void
): () => void {
    if (!accountcode || !chatId) return () => {};

    const key = createListenerKey("chat-messages", accountcode, chatId);

    return firebaseListenersPool.addListener(
        key,
        () => {
            const q = query(
                getMessagesCollection(accountcode, chatId),
                orderBy("createdAt", "asc")
            );

            return onSnapshot(
                q,
                (snap) => {
                    const messages = snap.docs.map(d => ({
                        id: d.id,
                        ...d.data()
                    }) as ChatMessage);
                    firebaseListenersPool.updateData(key, messages);
                },
                (error) => firebaseListenersPool.broadcastError(key, error)
            );
        },
        callback,
        errorCallback
    );
}

/**
 * Listener otimizado para notificações de agente
 */
export function useOptimizedAgentNotifications(
    accountcode: string,
    agentLogin: string,
    callback: (notifications: Notification[]) => void,
    errorCallback?: (error: unknown) => void
): () => void {
    if (!accountcode || !agentLogin) return () => {};

    const key = createListenerKey("agent-notifications", accountcode, agentLogin);

    return firebaseListenersPool.addListener(
        key,
        () => {
            const notificationsRef = getNotificationsCollection(accountcode);
            const q = query(
                notificationsRef,
                orderBy("createdAt", "desc")
            );

            return onSnapshot(
                q,
                (snapshot) => {
                    const notifications: Notification[] = [];
                    snapshot.forEach((doc) => {
                        const data = doc.data() as Notification;
                        if (data.targetAgents?.includes(agentLogin)) {
                            notifications.push({
                                id: doc.id,
                                ...data,
                            });
                        }
                    });
                    firebaseListenersPool.updateData(key, notifications);
                },
                (error) => firebaseListenersPool.broadcastError(key, error)
            );
        },
        callback,
        errorCallback
    );
}

/**
 * Listener otimizado para solicitações de pausa
 */
export function useOptimizedPauseRequests(
    accountcode: string,
    agentId: string,
    callback: (request: any) => void,
    errorCallback?: (error: unknown) => void
): () => void {
    if (!accountcode || !agentId) return () => {};

    const key = createListenerKey("pause-requests", accountcode, agentId);

    return firebaseListenersPool.addListener(
        key,
        () => {
            const pauseRef = rtdbRefs.pauseRequests(accountcode, agentId);

            return onSnapshot(
                pauseRef as any, // Cast necessário para compatibilidade
                (snap) => {
                    const data = snap.val();
                    firebaseListenersPool.updateData(key, data);
                },
                (error) => firebaseListenersPool.broadcastError(key, error)
            );
        },
        callback,
        errorCallback
    );
}