import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { CHAT_INDIVIDUAL_PREFIX } from "@/constants";
import { useOptimizedChatMessages } from "@/lib/firebase/optimized-listeners";

import { hslVar } from "@/utils/home";
import { Pause, MessageSquare, AlertCircle } from "lucide-react";
import { useDurationFrom } from "@/hooks/use-duration-form";
import { usePauseRequests } from "@/hooks/use-pause-requests";

import AgentChatDialog from "./agent/AgentChatDialog";
import AgentApproveReasonDialog from "./agent/approve-reason/ApproveReasonDialog";
import type { AgentView } from "@/hooks/use-optimized-realtime-agents";

type CardAgentProps = {
    ag: AgentView;
    messageCount?: number;
    isSelected: boolean;
    onSelect: (selected: boolean) => void;
    onDialogClose?: () => void;
    autoOpenDialog?: "chat" | "pause-requests";
};

function useUnreadForAgentCard(agentLogin: string | undefined) {
    const accountcode = useAuthStore((s) => s.company?.accountcode);
    const supervisorId = useAuthStore((s) => s.user?.id || s.user?.login);
    const [unread, setUnread] = useState<number>(0);

    useEffect(() => {
        if (!accountcode || !agentLogin || !supervisorId) {
            setUnread(0);
            return;
        }
        
        const chatId = CHAT_INDIVIDUAL_PREFIX(agentLogin, String(supervisorId));
        
        const unsubscribe = useOptimizedChatMessages(
            accountcode,
            chatId,
            (msgs) => {
                const count = msgs.filter(
                    (m) => m.receiverId === String(supervisorId) && !m.read
                ).length;
                setUnread(count);
            },
            (error) => {
                console.error("Erro ao carregar mensagens não lidas:", error);
                setUnread(0);
            }
        );
        
        return unsubscribe;
    }, [accountcode, agentLogin, supervisorId]);

    return unread;
}

export default function CardAgent({
    ag,
    messageCount,
    isSelected,
    onSelect,
    onDialogClose,
    autoOpenDialog,
}: CardAgentProps) {
    const [dialogChatOpen, setDialogChatOpen] = useState(false);
    const [dialogReasonOpen, setDialogReasonOpen] = useState(false);
    const lastClickRef = useRef<number>(0);

    const accountcode = useAuthStore((s) => s.company?.accountcode || "");

    // Hook para verificar se há solicitação de pausa pendente
    const { request: pauseRequest, loading: pauseLoading } = usePauseRequests({
        agentId: ag.login,
        accountcode,
    });

    // Verificar se há uma solicitação pendente
    const hasPendingPauseRequest =
        pauseRequest && pauseRequest.status === "pending";

    // Efeito para abrir diálogo automaticamente baseado na prop autoOpenDialog
    useEffect(() => {
        if (autoOpenDialog === "chat") {
            setDialogChatOpen(true);
        } else if (autoOpenDialog === "pause-requests") {
            setDialogReasonOpen(true);
        }
    }, [autoOpenDialog]);

    const computedUnread = useUnreadForAgentCard(
        messageCount == null ? ag.login : undefined
    );

    const pending = useMemo(() => {
        const v = messageCount ?? computedUnread;
        if (dialogChatOpen) return 0; // some apenas quando o modal de chat está aberto
        return v && v > 0 ? v : 0;
    }, [messageCount, computedUnread, dialogChatOpen]);

    // Calcular duration corretamente baseado no status
    const durationTimestamp = useMemo(() => {
        // Se o agente está em pausa e há uma solicitação aprovada, usar timestamp da aprovação
        if (
            ag.status === "Em pausa" &&
            pauseRequest &&
            pauseRequest.status === "approved" &&
            pauseRequest.respondedAt
        ) {
            // Converter timestamp para Date
            if (typeof pauseRequest.respondedAt === "number") {
                return new Date(pauseRequest.respondedAt);
            } else if (
                pauseRequest.respondedAt &&
                typeof pauseRequest.respondedAt === "object" &&
                "seconds" in pauseRequest.respondedAt
            ) {
                // Firestore Timestamp
                return new Date(
                    (pauseRequest.respondedAt as any).seconds * 1000
                );
            }
        }
        // Se o agente está em pausa mas não há dados de solicitação, usar dataevento
        if (ag.status === "Em pausa") {
            return ag.dataevento;
        }
        // Para outros status, usar dataevento normalmente
        return ag.dataevento;
    }, [ag.status, ag.dataevento, pauseRequest]);

    const duration = useDurationFrom(durationTimestamp);

    const handleCardClick = useCallback(() => {
        const now = Date.now();
        // Debounce de 500ms para evitar múltiplos cliques
        if (now - lastClickRef.current < 500) {
            console.log("Click ignorado devido ao debounce");
            return;
        }
        lastClickRef.current = now;

        if (!ag.isLoggedInPanel) return;

        // Se há uma solicitação de pausa pendente, abrir o modal de pausa
        if (hasPendingPauseRequest) {
            console.log("Abrindo modal de pausa para:", ag.login);
            setDialogReasonOpen(true);
            return;
        }

        // Comportamento normal de seleção
        onSelect(!isSelected);
    }, [
        ag.isLoggedInPanel,
        ag.login,
        hasPendingPauseRequest,
        onSelect,
        isSelected,
    ]);

    const handleDialogClose =
        (setter: (v: boolean) => void) => (open: boolean) => {
            setter(open);
            if (!open) onDialogClose?.();
        };

    return (
        <>
            <div
                className={[
                    "relative flex flex-col justify-between transition-all duration-300 transform-gpu",
                    "p-4 rounded-xl border shadow-sm bg-card group",
                    isSelected
                        ? "ring-2 ring-primary/40 scale-[1.02] shadow-md"
                        : "hover:shadow-md",
                    hasPendingPauseRequest
                        ? "ring-2 ring-orange-400/60 border-orange-300/50 bg-orange-50/30 dark:bg-orange-950/20 cursor-pointer"
                        : !ag.isLoggedInPanel
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer",
                    "max-w-sm w-full h-full",
                ].join(" ")}
                style={{
                    borderColor: hslVar(ag.color, 0.4),
                    backgroundColor: hslVar(ag.color, 0.02),
                }}
                onClick={handleCardClick}
            >
                {/* 1️⃣ Indicador de solicitação pendente + Filas */}
                <div className="space-y-2 mb-2">
                    {hasPendingPauseRequest && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 dark:bg-orange-950/30 border border-orange-300 dark:border-orange-700 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 animate-pulse" />
                            <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                                Solicitação de pausa pendente
                            </span>
                        </div>
                    )}
                    <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                        {ag.queues?.map((q) => (
                            <div
                                key={q.queueId}
                                className="px-3 py-1 text-xs font-semibold uppercase rounded-lg border bg-muted/30 text-muted-foreground whitespace-nowrap"
                            >
                                {q.queueName}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2️⃣ Nome + Ações */}
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <p
                            className="text-base font-semibold truncate group-hover:text-primary transition-colors"
                            title={ag.fullName}
                        >
                            {ag.displayName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate font-medium">
                            {ag.isLoggedInPanel && ag.status === "Em pausa"
                                ? ag.reason ?? "Motivo não identificado"
                                : ag.realRamal || ag.ramal}
                        </p>
                    </div>

                    {/* Botões lado direito */}
                    <div className="flex flex-col gap-2 items-center">
                        {/* Chat */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDialogChatOpen(true);
                                }}
                                className="aspect-square w-9 rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
                                style={{
                                    backgroundColor: hslVar(ag.color, 0.9),
                                    color: "white",
                                }}
                            >
                                <MessageSquare className="w-4 h-4" />
                            </button>

                            {pending > 0 && (
                                <span className="absolute -top-1 -right-1 rounded-full bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 shadow-sm transition-transform">
                                    {pending > 99 ? "99+" : pending}
                                </span>
                            )}
                        </div>

                        {/* Pausa */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setDialogReasonOpen(true);
                            }}
                            className="aspect-square w-9 rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
                            style={{
                                backgroundColor: hslVar(ag.color, 0.9),
                                color: "white",
                            }}
                        >
                            <Pause className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 3️⃣ Rodapé */}
                <div className="flex justify-start mt-3">
                    <span
                        className="px-3 py-1 rounded-md font-mono font-bold text-white text-xs shadow-sm"
                        style={{
                            background: `linear-gradient(135deg, ${hslVar(
                                ag.color,
                                0.85
                            )}, ${hslVar(ag.color, 0.65)})`,
                        }}
                    >
                        {duration}
                    </span>
                </div>
            </div>

            {/* Dialogs */}
            {dialogChatOpen && (
                <AgentChatDialog
                    agent={ag}
                    open={dialogChatOpen}
                    onOpenChange={handleDialogClose(setDialogChatOpen)}
                    onSelectedChange={onSelect}
                />
            )}
            {dialogReasonOpen && (
                <AgentApproveReasonDialog
                    agent={ag}
                    open={dialogReasonOpen}
                    onOpenChange={handleDialogClose(setDialogReasonOpen)}
                    onSelectedChange={onSelect}
                />
            )}
        </>
    );
}
