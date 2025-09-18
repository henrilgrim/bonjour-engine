import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/lib/firebase/firestore/chats/types";
import {
    getAllMessages,
    markMessageAsRead,
    sendMessage,
    subscribeToMessages,
} from "@/lib/firebase/firestore/chats";
import { useAuthStore } from "@/store/authStore";
import { CHAT_INDIVIDUAL_PREFIX } from "@/constants";
import { useAppStore } from "@/store/appStore";

type UseFirebaseChatParams = {
    supervisorId: string | null;
    autoSubscribe?: boolean;
    onNewMessage?: (msg: ChatMessage) => void;
};

export function useFirebaseChat({
    supervisorId,
    autoSubscribe = true,
    onNewMessage,
}: UseFirebaseChatParams) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const unsubRef = useRef<() => void>();
    const lastMsgIdRef = useRef<string | null>(null);

    const agentLogin = useAuthStore((s) => s.user?.login);
    const accountcode = useAppStore((s) => s.company?.accountcode);

    const chatId =
        agentLogin && supervisorId
            ? CHAT_INDIVIDUAL_PREFIX(agentLogin, supervisorId)
            : null;
    const ready = !!(chatId && accountcode);

    const loadMessages = useCallback(async () => {
        if (!ready) return;
        try {
            setLoading(true);
            const data = await getAllMessages(accountcode!, chatId!);
            setMessages(data);
            const last = data.at(-1);
            if (last?.id) lastMsgIdRef.current = last.id;
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [accountcode, chatId, ready]);

    const send = useCallback(
        async (msg: Omit<ChatMessage, "id">) => {
            if (!ready || !agentLogin) return;
            await sendMessage(accountcode!, chatId!, agentLogin, msg);
        },
        [accountcode, chatId, agentLogin, ready]
    );

    const markAsRead = useCallback(
        async (messageId: string) => {
            if (!ready) return;
            await markMessageAsRead(
                accountcode!,
                agentLogin!,
                chatId!,
                messageId
            );
        },
        [accountcode, agentLogin, chatId, ready]
    );

    useEffect(() => {
        if (!ready || !autoSubscribe) return;

        let isMounted = true;
        setLoading(true);

        const unsubscribe = subscribeToMessages(
            accountcode!,
            chatId!,
            (msgs) => {
                if (!isMounted) return;
                setMessages(msgs);

                // Detectar última mensagem e acionar onNewMessage se for nova e não do próprio agente
                const last = msgs.at(-1);
                if (!last) return;

                const changed = lastMsgIdRef.current !== last.id;
                if (changed) {
                    lastMsgIdRef.current = last.id;
                    const isFromAgent =
                        (last as any).senderLogin === agentLogin;
                    if (!isFromAgent && onNewMessage) onNewMessage(last);
                }
            },
            (err) => {
                if (isMounted) setError(err as Error);
            }
        );

        unsubRef.current = unsubscribe;

        // opcional: carregar histórico inicial
        loadMessages().finally(() => {
            if (isMounted) setLoading(false);
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [
        ready,
        accountcode,
        chatId,
        autoSubscribe,
        loadMessages,
        agentLogin,
        onNewMessage,
    ]);

    return {
        messages,
        loading,
        error,
        send,
        markAsRead,
        refresh: loadMessages,
    };
}
