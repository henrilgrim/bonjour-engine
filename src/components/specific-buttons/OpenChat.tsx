import { MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type OpenChatProps = {
    setOpenDialogChat: (open: boolean) => void
    className?: string,
    isPaused: boolean
    unreadCount?: number
};

export default function OpenChat({ setOpenDialogChat, isPaused, unreadCount = 0 }: OpenChatProps) {
    const className = isPaused ? 'left-6' : 'bottom-[100px] right-6'

    return (
        <button onClick={() => setOpenDialogChat(true)}
            className={cn(
                "guide--openned-chat group fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full shadow-lg",
                "bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300",
                "w-[60px] h-[60px] hover:w-[160px] overflow-hidden",
                className
            )} aria-label="Abrir chat com supervisor">

            <MessageCircle className="h-6 w-6 flex-shrink-0 transition-opacity duration-200 group-hover:opacity-0" />
            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 text-base font-extrabold">
                CHAT
            </span>

            {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute top-1 right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
            )}
        </button>
    )
}
