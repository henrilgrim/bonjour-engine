import { Check } from "lucide-react";
import clsx from "clsx";
import { useEffect } from "react";
import { useNotificationStore } from "@/lib/notifications/store";
import { ChatMessage } from "@/lib/firebase/firestore/chats/types";
import { formatTime } from "./utils";

export default function AgentMessageBubble({
    message,
    isOwn,
    showRole = false,
}: {
    message: ChatMessage;
    isOwn: boolean;
    showRole?: boolean;
}) {
    useEffect(() => {
        if (message?.id) {
            const store = useNotificationStore.getState();
            if (!store.isMessagePreviewed(message.id)) {
                store.markMessageAsPreviewed(message.id);
            }
        }
    }, [message?.id]);

    return (
        <div
            className={clsx(
                "flex mb-2",
                isOwn ? "justify-end" : "justify-start"
            )}
        >
            <div className="space-y-1 max-w-[100%]">
                {/* Nome e cargo do remetente */}
                {showRole && !isOwn && (
                    <div className="text-xs text-muted-foreground ml-3 mb-1">
                        <span className="font-medium">{message.senderName}</span>
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground">
                            {message.role === "supervisor" ? "Supervisor" : "Agente"}
                        </span>
                    </div>
                )}
                
                {/* Caixa de mensagem com rodapé */}
                <div
                    className={clsx(
                        "relative px-3 py-2.5 rounded-2xl text-sm shadow-sm border whitespace-pre-wrap break-words",
                        isOwn
                            ? "bg-primary text-primary-foreground rounded-br-md pr-10 pb-5 max-w-[300px]"
                            : message.role === "supervisor"
                            ? "bg-orange-100 dark:bg-orange-900/30 text-foreground border-orange-200 dark:border-orange-800 rounded-bl-md pr-10 pb-5 max-w-[300px]"
                            : "bg-muted text-foreground rounded-bl-md pr-10 pb-5 max-w-[300px]"
                    )}
                >
                    {message.content}

                    {/* Rodapé da bolha */}
                    <div
                        className={clsx(
                            "absolute bottom-1 right-2 flex items-center gap-1 text-[10px]",
                            isOwn ? "text-white/80" : "text-muted-foreground"
                        )}
                    >
                        <span>{formatTime(message.createdAt)}</span>
                        {isOwn &&
                            (message.read ? (
                                <div className="relative w-4 h-3">
                                    <Check
                                        className="absolute w-3 h-3 text-green-500"
                                        style={{ left: "0.5px", top: "0" }}
                                    />
                                    <Check
                                        className="absolute w-3 h-3 text-green-500"
                                        style={{ left: "6px", top: "0" }}
                                    />
                                </div>
                            ) : (
                                <Check className="w-3 h-3 text-muted-foreground" />
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
