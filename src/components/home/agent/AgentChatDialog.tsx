import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Paperclip, Send, ChevronDown } from "lucide-react"
import { hslVar } from "@/utils/home"
import { useFirebaseChat } from "@/hooks/use-firebase-chat"
import { ChatMessage } from "@/lib/firebase/firestore/chats/types"
import { useAuthStore } from "@/store/authStore"
import { formatTime } from "@/lib/utils"

interface AgentChatDialogProps {
    agent: {
        id: string
        displayName: string
        fullName: string
        initials: string
        login: string
        ramal: string
        queueId: string
        queueName: string
        status: string
        duration: string
        color: string
        dataevento: string
    }
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelectedChange?: (selected: boolean) => void

    // infinite scroll (opcional)
    hasMore?: boolean
    loadingMore?: boolean
    onLoadMore?: () => Promise<void> | void
}
export default function AgentChatDialog({ agent, open, onOpenChange, onSelectedChange, hasMore = false, loadingMore = false, onLoadMore }: AgentChatDialogProps) {
    const scrollRef = useRef<HTMLDivElement | null>(null)
    const [value, setValue] = useState("")
    const [nearBottom, setNearBottom] = useState(true)

    const { messages, loading, error, send, markAsRead } = useFirebaseChat({ agentLogin: agent.login });

    const currentUserId = useAuthStore((state) => state.user?.id);
    const supervisorName = useAuthStore((state) => state.user?.nome);
    const accountcode = useAuthStore((state) => state.company?.accountcode);

    // --- utils
    const isOwn = useCallback((m: ChatMessage) => m.senderId === currentUserId, [currentUserId])

    const groups = useMemo(() => {
        const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
        const map = new Map<string, ChatMessage[]>()
        for (const m of messages) {
            const d = m.createdAt?.toDate ? m.createdAt.toDate() : m.createdAt instanceof Date ? m.createdAt : new Date()
            const day = fmt(d)
            if (!map.has(day)) map.set(day, [])
            map.get(day)?.push(m)
        }
        return Array.from(map.entries()).map(([day, list]) => ({ day, list }))
    }, [messages])

    // --- scroll helpers
    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        const el = scrollRef.current
        if (!el) return
        el.scrollTo({ top: el.scrollHeight, behavior })
    }

    const isUserNearBottom = () => {
        const el = scrollRef.current
        if (!el) return true
        const threshold = 120 // px
        return el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    }

    // manter-se no fim quando chegam novas mensagens (se usuário estiver perto do fim)
    const prevCountRef = useRef(0)
    useLayoutEffect(() => {
        const count = messages.length
        const wasNear = nearBottom || prevCountRef.current === 0
        if (count > prevCountRef.current && wasNear) {
            // primeira carga também suave (fica bonito com a animação do dialog)
            scrollToBottom("smooth")
        }
        prevCountRef.current = count
    }, [messages])

    // recalcula `nearBottom` ao rolar
    const handleScroll = () => setNearBottom(isUserNearBottom())

    // carregar mais no topo
    const topSentinel = useRef<HTMLDivElement | null>(null)
    useEffect(() => {
        if (!onLoadMore || !hasMore) return
        const el = topSentinel.current
        const scroller = scrollRef.current
        if (!el || !scroller) return

        let prevHeight = 0
        const io = new IntersectionObserver(async (entries) => {
            for (const e of entries) {
                if (e.isIntersecting && hasMore && !loadingMore) {
                    // guarda altura antes de carregar
                    prevHeight = scroller.scrollHeight
                    await onLoadMore()
                    // mantém posição após prepend
                    const diff = scroller.scrollHeight - prevHeight
                    scroller.scrollTop = diff + scroller.scrollTop
                }
            }
        }, { root: scroller, rootMargin: "200px 0px 0px 0px", threshold: 0 })
        io.observe(el)
        return () => io.disconnect()
    }, [onLoadMore, hasMore, loadingMore])

    // auto focus quando abre
    const inputRef = useRef<HTMLTextAreaElement | null>(null)
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 0)
            // dá um “tap” no fim
            setTimeout(() => scrollToBottom("auto"), 0)
        }
    }, [open])

    // enviar
    const doSend = async () => {
        const text = value.trim()
        if (!text) return
        setValue("")
        await send({
            senderId: currentUserId,
            senderName: supervisorName,
            receiverId: agent.login,
            type: "text",
            content: text,
            read: false,
            accountcode: accountcode,
            role: "supervisor",
            attachments: [],
            groupId: null,
            createdAt: new Date()

        })
        // se o usuário estava no fim, garantimos ir ao fim após envio
        scrollToBottom("smooth")
    }

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            void doSend()
        }
    }

    // auto-resize do textarea
    const handleInput: React.FormEventHandler<HTMLTextAreaElement> = (e) => {
        const ta = e.currentTarget
        ta.style.height = "0px"
        ta.style.height = Math.min(160, ta.scrollHeight) + "px"
    }

    useEffect(() => {
        if (!agent || !currentUserId) return;

        const unreadMessages = messages.filter((m) => m.receiverId === currentUserId && !m.read);

        if (unreadMessages.length > 0) {
            unreadMessages.forEach((msg) => {
                markAsRead(msg.id);
            });
        }
    }, [messages, agent, currentUserId, markAsRead]);


    const handleCloseDialog = () => {
        onOpenChange(false)
        onSelectedChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleCloseDialog}>
            <DialogContent
                className={[
                    "max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col",

                    // animações de abrir/fechar
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
                    "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
                    "data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-bottom-2",
                    // melhora a performance da animação
                    "will-change-[transform,opacity]"
                ].join(" ")}
            >
                <DialogHeader
                    className={[
                        "sticky top-0 z-20",                            // gruda no topo quando lista rola
                        "px-4 py-3 border-b",
                        "bg-gradient-to-b from-card/80 to-card/50",
                        "backdrop-blur supports-[backdrop-filter]:bg-card/60"
                    ].join(" ")}
                >
                    <div className="flex items-center justify-between gap-3">
                        {/* ESQUERDA: avatar + infos */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative">
                                {/* Avatar com iniciais */}
                                <div
                                    className="grid place-items-center h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-sm font-semibold"
                                    aria-label={`Avatar de ${agent.displayName || agent.login}`}
                                >
                                    {(agent.displayName || agent.login)?.slice(0, 2)?.toUpperCase()}
                                </div>
                                {/* Presença */}
                                <PresenceDot status={agent.status} />
                            </div>

                            <div className="min-w-0">
                                <DialogTitle className="text-base font-semibold leading-tight truncate">
                                    {agent.displayName || agent.login}
                                </DialogTitle>

                                {/* linha de meta-infos */}
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hslVar(agent.color) }} />
                                        {agent.queueName || "Sem fila"}
                                    </span>
                                    <span className="opacity-50">•</span>
                                    <span title="Login">{agent.login}</span>
                                    {agent.ramal && (
                                        <>
                                            <span className="opacity-50">•</span>
                                            <span title="Ramal">ramal {agent.ramal}</span>
                                        </>
                                    )}
                                    {/* status badge enxuto */}
                                    <span className={["ml-1 inline-flex items-center rounded-full px-2 py-0.5",
                                        "border text-[11px] leading-none",
                                        badgeTone(agent.status)
                                    ].join(" ")}>
                                        {agent.status}
                                    </span>
                                </div>

                                <DialogDescription className="mt-0.5 text-[11px] text-muted-foreground/80">
                                    Última atividade: {new Date(agent.dataevento).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                                </DialogDescription>
                            </div>
                        </div>

                        {/* DIREITA: ações */}
                        <div className="flex items-center gap-1 shrink-0">
                            {/* <Button variant="ghost" size="icon" className="h-8 w-8" title="Silenciar">
                                <span className="text-lg leading-none">🔕</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Fixar conversa">
                                <span className="text-lg leading-none">📌</span>
                            </Button> */}
                            <Button variant="outline" size="sm" className="h-8" title="Fechar" onClick={() => {
                                onOpenChange(false)
                                onSelectedChange?.(false)
                            }}>
                                Fechar
                            </Button>
                        </div>
                    </div>
                </DialogHeader>


                {/* LISTA DE MENSAGENS */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 min-h-[300px] overflow-y-auto nice-scroll px-3 py-3 relative scroll-smooth"
                >
                    {/* sentinel topo p/ infinite scroll */}
                    {onLoadMore && hasMore && <div ref={topSentinel} className="h-2 w-full" />}

                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                            <div className="p-4 rounded-full bg-muted/40">
                                <Send className="h-8 w-8 text-muted-foreground/70" />
                            </div>
                            <p className="text-sm font-medium">Nenhuma mensagem ainda</p>
                            <p className="text-xs max-w-[260px]">
                                Inicie uma conversa com <span className="font-semibold">{agent.displayName || agent.login}</span>.
                            </p>
                        </div>
                    ) : (
                        groups.map(({ day, list }) => (
                            <div key={day} className="mb-4">
                                <div className="sticky top-0 z-10 flex justify-center">
                                    <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground border">
                                        {day}
                                    </span>
                                </div>
                                <div className="mt-2 space-y-2">
                                    {list.map((m) => (
                                        <MessageBubble key={m.id} own={isOwn(m)} msg={m} />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* INPUT */}
                <div className="border-t bg-card/60 backdrop-blur-sm px-3 sm:px-4 py-2">
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <Paperclip className="h-5 w-5" />
                        </Button>

                        <div className="relative flex-1">
                            <textarea
                                ref={inputRef}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onInput={handleInput}
                                rows={1}
                                placeholder="Digite uma mensagem"
                                className="w-full resize-none max-h-40 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1"
                            />
                        </div>

                        <Button onClick={() => void doSend()} disabled={!value.trim()} className="shrink-0">
                            <Send className="h-4 w-4 mr-1" />
                            Enviar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

/* ------------------------ BUBBLE ------------------------ */
function MessageBubble({ own, msg }: { own: boolean; msg: ChatMessage }) {
    const time = formatTime(msg.createdAt)

    return (
        <div className={`flex ${own ? "justify-end" : "justify-start"} px-1`}>
            <div className={["flex flex-col max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm", own ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"].join(" ")}>
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                <div className={`self-end mt-1 text-[10px] ${own ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {time} {own && statusTick(msg.read)}
                </div>
            </div>
        </div>
    )
}

function statusTick(status: ChatMessage["read"]) {
    if (status) return "✓✓"
    return "✓"
}

function PresenceDot({ status }: { status?: string }) {
    const tone =
        status?.toLowerCase().includes("dispon") ? "bg-emerald-500"
            : status?.toLowerCase().includes("pausa") ? "bg-amber-500"
                : status?.toLowerCase().includes("ocup") ? "bg-red-500"
                    : "bg-zinc-400"

    return (
        <span className={["absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card", tone].join(" ")}
            aria-label={`Status: ${status ?? "indefinido"}`}
            title={status}
        />
    )
}

function badgeTone(status?: string) {
    const s = status?.toLowerCase() || ""
    if (s.includes("dispon")) return "border-emerald-300/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
    if (s.includes("pausa")) return "border-amber-300/40 text-amber-700 dark:text-amber-300 bg-amber-500/10"
    if (s.includes("ocup")) return "border-rose-300/40 text-rose-700 dark:text-rose-300 bg-rose-500/10"
    return "border-muted text-muted-foreground bg-muted/30"
}
