import { useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { useFirebaseSupervisors } from "./use-firebase-supervisors";
import { useNotifications } from "@/lib/notifications";
import { subscribeToAllMessagesForAgent_byEnumeratingChats } from "@/lib/firebase/firestore/chats";
import type { ChatMessage } from "@/lib/firebase/firestore/chats/types";

function extractSupervisorIdFromChatId(chatId?: string | null) {
    if (!chatId) return null;
    const m = /^ag_(.+?)__sup_(.+)$/.exec(chatId);
    return m?.[2] ?? null;
}

/**
 * Hook que escuta TODAS as mensagens dos chats do agente em tempo real
 * e dispara notificações globais quando necessário (modelo global).
 */
export function useGlobalChatListener() {
    const user = useAuthStore((s) => s.user);
    const accountcode = useAppStore((s) => s.company?.accountcode);
    const { supervisors } = useFirebaseSupervisors();

    const { notifyIncoming } = useNotifications();

    // Mensagens já processadas (evita duplicatas)
    const processedMessagesRef = useRef<Set<string>>(new Set());
    // Evita notificar histórico no primeiro snapshot
    const initializedRef = useRef(false);

    const handleNewMessage = useCallback(
        (supervisorId: string, message: ChatMessage) => {
            if (!user?.login) return;

            // Processa só mensagens de supervisor (opcional: só não lidas)
            if (message.role !== "supervisor") return;
            if ((message as any).read === true) return;

            // Se houver receiverId na mensagem, exige que seja o agente atual
            const receiverOk =
                (message as any).receiverId == null ||
                String((message as any).receiverId) === String(user.login);
            if (!receiverOk) return;

            // Dedupe por id
            if (!message.id || processedMessagesRef.current.has(message.id))
                return;
            processedMessagesRef.current.add(message.id);

            // Encontra dados do supervisor para a notificação
            const supervisor = supervisors.find(
                (s) => s.id === supervisorId
            ) ?? {
                id: supervisorId,
                name: supervisorId,
                status: "logged" as const,
                lastLoginAt: Date.now(),
            };

            notifyIncoming(supervisor, message);
        },
        [user?.login, supervisors, notifyIncoming]
    );

    useEffect(() => {
        if (!user?.login || !accountcode) return;

        const unsubPromise = subscribeToAllMessagesForAgent_byEnumeratingChats(
            accountcode,
            user.login,
            (allMsgs: ChatMessage[]) => {
                if (!initializedRef.current) {
                    for (const m of allMsgs) {
                        if (m.id) processedMessagesRef.current.add(m.id);
                    }
                    initializedRef.current = true;
                    return;
                }

                for (const m of allMsgs) {
                    if (m.id && processedMessagesRef.current.has(m.id))
                        continue;

                    const supId = m.senderId;
                    if (!supId) continue;

                    handleNewMessage(supId, m);
                }

                if (processedMessagesRef.current.size > 2000) {
                    const keep = Array.from(processedMessagesRef.current).slice(
                        -1000
                    );
                    processedMessagesRef.current = new Set(keep);
                }
            },
            (err) => {
                console.error("useGlobalChatListener (global) error:", err);
            }
        );

        return () => {
            // resolver a promise e executar o unsubscribe retornado
            (async () => {
                try {
                    const unsub = await unsubPromise;
                    unsub?.();
                } catch {
                    /* noop */
                }
            })();
        };
    }, [user?.login, accountcode, handleNewMessage]);

    return {
        isListening: !!user?.login && !!accountcode,
    };
}
