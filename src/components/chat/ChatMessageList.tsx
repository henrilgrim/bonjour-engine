import { useMemo } from "react";
import { MessageCircle } from "lucide-react";
import type { ChatMessage } from "@/lib/firebase/firestore/chats/types";
import type { Agent } from "@/types/auth-store";
import AgentMessageBubble from "./AgentMessageBubble";
import { toDateSafe, formatDate } from "./utils";

interface ChatMessageListProps {
    messages: ChatMessage[];
    user: Agent | null;
}

export function ChatMessageList({ messages, user }: ChatMessageListProps) {
    const { grouped, firstUnreadId, unreadCount } = useMemo(() => {
        if (!user) {
            return {
                grouped: {} as Record<string, ChatMessage[]>,
                firstUnreadId: null as string | null,
                unreadCount: 0,
            };
        }

        // Agrupar mensagens por data
        const g: Record<string, ChatMessage[]> = {};
        messages.forEach((m) => {
            const when = toDateSafe(
                (m as any).createdAt ?? (m as any).timestamp
            );
            const k = formatDate(when);
            (g[k] ||= []).push(m);
        });

        // Calcular mensagens não lidas
        const unread = messages.filter(
            (m) => m.receiverId === String(user.login) && !m.read
        );

        return {
            grouped: g,
            firstUnreadId: unread[0]?.id ?? null,
            unreadCount: unread.length,
        };
    }, [messages, user]);

    if (messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <MessageCircle className="h-10 w-10 mb-2" />
                <p>Nenhuma mensagem ainda</p>
                <p className="text-xs">
                    Envie a primeira mensagem para seu supervisor
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {Object.entries(grouped).map(([date, list]) => (
                <div key={date} className="mb-4">
                    <div className="flex items-center gap-2 my-2">
                        <div className="h-px bg-border flex-1" />
                        <span className="text-[11px] text-muted-foreground">
                            {date}
                        </span>
                        <div className="h-px bg-border flex-1" />
                    </div>

                    <div className="space-y-2">
                        {list.map((m) => {
                            const isOwn = m.senderId === user?.id;
                            const showUnreadDivider = m.id === firstUnreadId;

                            return (
                                <div key={m.id}>
                                    {/* Separador de mensagens não lidas */}
                                    {showUnreadDivider && unreadCount > 0 && (
                                        <div
                                            className="flex items-center my-3"
                                            aria-label="Separador de mensagens não lidas"
                                        >
                                            <div className="flex-1 h-px bg-border" />
                                            <span className="px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
                                                {unreadCount === 1
                                                    ? "1 mensagem não lida"
                                                    : `${unreadCount} mensagens não lidas`}
                                            </span>
                                            <div className="flex-1 h-px bg-border" />
                                        </div>
                                    )}

                                    <div
                                        className={`flex ${
                                            isOwn
                                                ? "justify-end"
                                                : "justify-start"
                                        }`}
                                    >
                                         <div className="max-w-[85%] sm:max-w-[70%]">
                                            <AgentMessageBubble
                                                message={m}
                                                isOwn={isOwn}
                                                showRole={true}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}