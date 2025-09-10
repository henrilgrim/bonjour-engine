import { Check } from "lucide-react"
import clsx from "clsx"
import { useEffect } from "react"
import { useCentralNotificationStore } from "@/store/centralNotificationsStore"
import { ChatMessage } from "@/lib/firebase/firestore/chats/types"
import { formatTime } from "./utils"

export default function AgentMessageBubble({
    message,
    isOwn,
}: {
    message: ChatMessage
    isOwn: boolean
}) {
    useEffect(() => {
        if (message?.id) {
            const store = useCentralNotificationStore.getState()
            if (!store.isMessagePreviewed(message.id)) {
                store.markMessageAsPreviewed(message.id)
            }
        }
    }, [message?.id])

    return (
        <div className={clsx("flex mb-2", isOwn ? "justify-end" : "justify-start")}>
            <div className="space-y-1 max-w-[100%]">
                {/* Caixa de mensagem com rodapé */}
                <div className={clsx("relative px-3 py-2.5 rounded-2xl text-sm shadow-sm border whitespace-pre-wrap break-words", isOwn ? "bg-primary text-primary-foreground rounded-br-md pr-10 pb-5 max-w-[300px]" : "bg-muted text-foreground rounded-bl-md pr-10 pb-5 max-w-[300px]")}>
                    {message.content}

                    {/* Rodapé da bolha */}
                    <div className={clsx("absolute bottom-1 right-2 flex items-center gap-1 text-[10px]", isOwn ? "text-white/80" : "text-muted-foreground")}>
                        <span>{formatTime(message.createdAt)}</span>
                        {isOwn && (
                            message.read ? (
                                <div className="relative w-4 h-3">
                                    <Check className="absolute w-3 h-3 text-green-500" style={{ left: "0.5px", top: "0" }} />
                                    <Check className="absolute w-3 h-3 text-green-500" style={{ left: "6px", top: "0" }} />
                                </div>
                            ) : (
                                <Check className="w-3 h-3 text-muted-foreground" />
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
