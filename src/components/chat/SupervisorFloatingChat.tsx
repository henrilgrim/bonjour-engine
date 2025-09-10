import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MessageCircle, X, Send, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { SupervisorSelector } from "./SupervisorSelector";
import { useFirebaseChat } from "@/hooks/use-firebase-chat";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage } from "@/lib/firebase/firestore/chats/types";
import AgentMessageBubble from "./AgentMessageBubble";
import {
    SupervisorOnline,
    useFirebaseSupervisors,
} from "@/hooks/use-firebase-supervisors";
import { toDateSafe, formatDate } from "./utils";
import { useCentralNotifications } from "@/store/centralNotificationsStore";

type Props = {
    open: boolean;
    onClose: () => void;
    isPaused: boolean;
    initialSupervisorId?: string | null;
};

export function SupervisorFloatingChat({
    open,
    onClose,
    isPaused,
    initialSupervisorId,
}: Props) {
    const { toast } = useToast();
    const user = useAuthStore((s) => s.user);
    const company = useAppStore((s) => s.company);
    const { markMessageAsViewed } = useCentralNotifications();
    const { supervisors } = useFirebaseSupervisors();

    const [selectedSupervisor, setSelectedSupervisor] =
        useState<SupervisorOnline | null>(null);
    const [sending, setSending] = useState(false);

    const { messages, loading, send, markAsRead } = useFirebaseChat({
        supervisorId: selectedSupervisor?.id ?? null,
        autoSubscribe: !!selectedSupervisor?.id && !!company?.accountcode,
    });

    const rootRef = useRef<HTMLDivElement>(null);
    const msgEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [draft, setDraft] = useState("");
    const [showSelector, setShowSelector] = useState(true);

    const autosize = () => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
        ta.style.overflowY = ta.scrollHeight > 160 ? "auto" : "hidden";
    };

    const className = isPaused ? "left-4" : "right-4";

    const sendMessage = useCallback(
        async (message: string) => {
            if (
                !user ||
                !selectedSupervisor ||
                !message.trim() ||
                !company?.accountcode
            )
                return;
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
                    receiverId: selectedSupervisor.id,
                    createdAt: new Date(),
                };
                await send(chatMessage);
            } catch (e) {
                console.error("Erro ao enviar mensagem:", e);
                toast({
                    title: "Erro ao enviar",
                    description: "Não foi possível enviar a mensagem.",
                    variant: "destructive",
                });
            }
        },
        [user, selectedSupervisor, company?.accountcode, send, toast]
    );

    const handleSend = async () => {
        const value = draft.trim();
        const ta = textareaRef.current;
        if (!value) {
            ta?.focus();
            return;
        }
        setSending(true);
        try {
            await sendMessage(value);
        } finally {
            setSending(false);
            setDraft("");
            requestAnimationFrame(() => {
                ta?.focus();
                msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
            });
        }
    };

    useEffect(() => {
        autosize();
    }, [draft]);

    useEffect(() => {
        if (!open) return;
        msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, open]);

    useEffect(() => {
        if (!open) return;
        if (selectedSupervisor) {
            const t = setTimeout(() => textareaRef.current?.focus(), 150);
            return () => clearTimeout(t);
        }
    }, [open, selectedSupervisor]);

    useEffect(() => {
        if (!open) {
            setSelectedSupervisor(null);
            setShowSelector(true);
        } else if (initialSupervisorId && supervisors.length > 0) {
            // Se há um supervisor específico solicitado, seleciona-o diretamente
            const targetSupervisor = supervisors.find(
                (s) => s.id === initialSupervisorId
            );
            if (targetSupervisor) {
                setSelectedSupervisor(targetSupervisor);
                setShowSelector(false);
            }
        }
    }, [open, initialSupervisorId, supervisors]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (!rootRef.current) return;
            const target = e.target as Node;
            const isInside = rootRef.current.contains(target);
            const isBackdrop =
                (target as HTMLElement)?.dataset?.chatBackdrop === "1";
            if (isBackdrop && !isInside) onClose();
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [open, onClose]);

    useEffect(() => {
        if (!open || !user || !selectedSupervisor) return;
        const unread = messages.filter(
            (m) => m.receiverId === String(user.login) && !m.read
        );
        if (unread.length > 0) {
            unread.forEach((msg) => {
                markAsRead(msg.id);
                markMessageAsViewed(msg.id);
            });
        }
    }, [
        messages,
        open,
        user,
        selectedSupervisor,
        markAsRead,
        markMessageAsViewed,
    ]);

    const { firstUnreadId, unreadCount } = useMemo(() => {
        if (!user)
            return { firstUnreadId: null as string | null, unreadCount: 0 };
        const unread = messages.filter(
            (m) => m.receiverId === String(user.login) && !m.read
        );
        return {
            firstUnreadId: unread[0]?.id ?? null,
            unreadCount: unread.length,
        };
    }, [messages, user]);

    const grouped = useMemo(() => {
        const g: Record<string, typeof messages> = {};
        messages.forEach((m) => {
            const when = toDateSafe(
                (m as any).createdAt ?? (m as any).timestamp
            );
            const k = formatDate(when);
            (g[k] ||= []).push(m);
        });
        return g;
    }, [messages]);

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSelectSupervisor = (supervisor: SupervisorOnline) => {
        setSelectedSupervisor(supervisor);
        setShowSelector(false);
    };

    const handleBackToSelector = () => {
        setShowSelector(true);
        setSelectedSupervisor(null);
    };

    if (!open) return null;

    return (
        <>
            <div
                data-chat-backdrop="1"
                className="fixed inset-0 z-[60] bg-black/10 backdrop-blur-[1px] opacity-100 transition-opacity"
                aria-hidden
                style={{ marginTop: 0 }}
            />

            <div
                ref={rootRef}
                className={[
                    "fixed z-[61] bottom-24",
                    "w-[min(92vw,420px)]",
                    "max-h-[80dvh] sm:h-[560px]",
                    "bg-card border rounded-2xl shadow-2xl",
                    "flex flex-col overflow-hidden",
                    "transform transition-all duration-300",
                    "opacity-100 translate-y-0 scale-100",
                    className,
                ].join(" ")}
                role="dialog"
                aria-label="Chat com Supervisor"
            >
                {/* Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {!showSelector && selectedSupervisor && (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleBackToSelector}
                                aria-label="Voltar para seleção de supervisor"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <MessageCircle className="h-5 w-5" />
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                                {showSelector
                                    ? "Chat com Supervisor"
                                    : `Chat com ${
                                          selectedSupervisor?.name ||
                                          "Supervisor"
                                      }`}
                            </span>
                            {!showSelector &&
                                (!selectedSupervisor?.id ||
                                    !user ||
                                    !company?.accountcode) && (
                                    <span className="text-xs text-muted-foreground">
                                        Indisponível
                                    </span>
                                )}
                        </div>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onClose}
                        aria-label="Fechar chat"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Conteúdo principal */}
                <div className="flex-1 min-h-0 overflow-y-auto nice-scroll px-3 py-3">
                    {showSelector ? (
                        <SupervisorSelector
                            onSelectSupervisor={handleSelectSupervisor}
                        />
                    ) : loading ? (
                        <div className="flex items-center justify-center py-10 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Carregando mensagens...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                            <MessageCircle className="h-10 w-10 mb-2" />
                            <p>Nenhuma mensagem ainda</p>
                            <p className="text-xs">
                                Envie a primeira mensagem para seu supervisor
                            </p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([date, list]) => (
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
                                        const showUnreadDivider =
                                            m.id === firstUnreadId;

                                        return (
                                            <div key={m.id}>
                                                {/* Separador de mensagens não lidas (aparece uma vez) */}
                                                {showUnreadDivider &&
                                                    unreadCount > 0 && (
                                                        <div
                                                            className="flex items-center my-3"
                                                            aria-label="Separador de mensagens não lidas"
                                                        >
                                                            <div className="flex-1 h-px bg-border" />
                                                            <span className="px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
                                                                {unreadCount ===
                                                                1
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
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={msgEndRef} />
                </div>

                {!showSelector && selectedSupervisor && (
                    <div className="border-t bg-background p-3 flex-shrink-0">
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={textareaRef}
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder={`Mensagem para supervisor...`}
                                disabled={
                                    !selectedSupervisor?.id ||
                                    !user ||
                                    !company?.accountcode ||
                                    sending
                                }
                                rows={1}
                                className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <Button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleSend}
                                disabled={
                                    !selectedSupervisor?.id ||
                                    !user ||
                                    !company?.accountcode ||
                                    sending ||
                                    !draft.trim()
                                }
                                className="shrink-0 rounded-full p-2"
                            >
                                {sending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1.5">
                            Enter para enviar • Shift+Enter nova linha
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
