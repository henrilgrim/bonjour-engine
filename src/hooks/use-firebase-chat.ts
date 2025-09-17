import { useCallback, useEffect, useRef, useState } from "react"
import { ChatMessage } from "@/lib/firebase/firestore/chats/types"
import { getAllMessages, markMessageAsRead, sendMessage, subscribeToMessages } from "@/lib/firebase/firestore/chats"
import { useAuthStore } from "@/store/authStore"
import { CHAT_INDIVIDUAL_PREFIX } from "@/constants"

type UseFirebaseChatParams = {
    agentLogin: string
    autoSubscribe?: boolean
}

export function useFirebaseChat({ agentLogin, autoSubscribe = true }: UseFirebaseChatParams) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const unsubRef = useRef<() => void>()
    const { user } = useAuthStore()

    const accountcode = user.accountcode
    const chatId = CHAT_INDIVIDUAL_PREFIX(agentLogin, user.id)

    const loadMessages = useCallback(async () => {
        try {
            setLoading(true)
            const data = await getAllMessages(accountcode, chatId)
            setMessages(data)
        } catch (err) {
            setError(err as Error)
        } finally {
            setLoading(false)
        }
    }, [accountcode, chatId])

    const send = useCallback(
        async (msg: Omit<ChatMessage, "id">) => {
            await sendMessage(accountcode, chatId, agentLogin, msg)
        },
        [accountcode, chatId]
    )

    const markAsRead = useCallback(
        async (messageId: string) => {
            await markMessageAsRead(accountcode, chatId, messageId)
        },
        [accountcode, chatId]
    )

    useEffect(() => {
        if (!autoSubscribe) return;

        let isMounted = true;
        const unsubscribe = subscribeToMessages(accountcode, chatId, (msgs) => {
            if (isMounted) setMessages(msgs);
        }, (err) => {
            if (isMounted) setError(err as Error);
        });

        unsubRef.current = unsubscribe;
        setLoading(true);

        loadMessages().finally(() => {
            if (isMounted) setLoading(false);
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [accountcode, chatId, autoSubscribe, loadMessages]);

    return {
        messages,
        loading,
        error,
        send,
        markAsRead,
        refresh: loadMessages,
    }
}
