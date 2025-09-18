import { useCallback, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { useFirebaseChat } from "@/hooks/use-firebase-chat";
import { useNotificationStore } from "@/lib/notifications/store";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage } from "@/lib/firebase/firestore/chats/types";
import type { SupervisorOnline } from "@/hooks/use-firebase-supervisors";
import { ChatMessageList } from "./ChatMessageList";
import { ChatMessageInput } from "./ChatMessageInput";

interface SupervisorChatViewProps {
    supervisor: SupervisorOnline;
}

export function SupervisorChatView({ supervisor }: SupervisorChatViewProps) {
    const { toast } = useToast();
    const user = useAuthStore((s) => s.user);
    const company = useAppStore((s) => s.company);
    const markMessageAsViewed = useNotificationStore(
        (s) => s.markMessageAsViewed
    );

    const msgEndRef = useRef<HTMLDivElement>(null);

    const { messages, loading, send, markAsRead } = useFirebaseChat({
        supervisorId: supervisor?.id ?? null,
        autoSubscribe: !!supervisor?.id && !!company?.accountcode,
    });

    const isAvailable = !!(supervisor?.id && user && company?.accountcode);

    const sendMessage = useCallback(
        async (message: string) => {
            if (!user || !supervisor || !company?.accountcode) return;

            try {
                const chatMessage: Omit<ChatMessage, "id"> = {
                    content: message.trim(),
                    senderId: user.id,
                    senderName: user.name,
                    type: "text",
                    role: "agent",
                    read: false,
                    accountcode: company.accountcode,
                    attachments: [],
                    groupId: null,
                    receiverId: supervisor.id,
                    createdAt: new Date(),
                };
                await send(chatMessage);
            } catch (e) {
                toast({
                    title: "Erro ao enviar",
                    description: "Não foi possível enviar a mensagem.",
                    variant: "destructive",
                });
                throw e;
            }
        },
        [user, supervisor, company?.accountcode, send, toast]
    );

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Mark messages as read when chat is open
    useEffect(() => {
        if (!user || !supervisor) return;
        const unread = messages.filter(
            (m) => m.receiverId === String(user.login) && !m.read
        );
        if (unread.length > 0) {
            unread.forEach((msg) => {
                markAsRead(msg.id);
                markMessageAsViewed(msg.id);
            });
        }
    }, [messages, user, supervisor, markAsRead, markMessageAsViewed]);

    if (loading) {
        return (
            <div className="flex-1 min-h-0 overflow-y-auto nice-scroll px-3 py-3">
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Carregando mensagens...
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex-1 min-h-0 overflow-y-auto nice-scroll px-3 py-3">
                <ChatMessageList messages={messages} user={user} />
                <div ref={msgEndRef} />
            </div>

            <ChatMessageInput
                onSend={sendMessage}
                disabled={!isAvailable}
                placeholder="Mensagem para supervisor..."
            />
        </>
    );
}