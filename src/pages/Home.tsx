import { useEffect, useState, useCallback, useMemo } from "react";

import { PauseDialog, PauseAlert, PauseButton } from "@/components/pause";

import { BreaksTable } from "@/components/home/BreaksTable";
import { CallsTable } from "@/components/home/CallsTable";
import { StatsHeader } from "@/components/layout/StatsHeader";

import OpenChat from "@/components/specific-buttons/OpenChat";

import { usePauseControl } from "@/hooks/use-pause-control";
import { useTotalUnreadCount } from "@/hooks/use-total-unread-count";

import { useTableStore } from "@/store/tableStore";
import { useReasonStore } from "@/store/reasonStore";
import { useNotifications } from "@/lib/notifications";

import { SupervisorFloatingChat } from "@/components/chat/SupervisorFloatingChat";

export default function HomePage() {
    const [isDialogBreakOpen, setDialogBreakOpen] = useState(false);
    const [isChatOpen, setChatOpen] = useState(false);
    const [chatSupervisorId, setChatSupervisorId] = useState<string | null>(
        null
    );

    const { isPaused, isWaitingApproval } = usePauseControl();
    const { tickets, fetchTickets, reasonsData, fetchReasonsData, setActive } =
        useTableStore();
    const { reasons: allReasonsMetadata } = useReasonStore();
    const { totalUnread } = useTotalUnreadCount();

    // Initialize notifications
    useNotifications();

    // Função para abrir chat com supervisor específico
    const openChatWithSupervisor = useCallback((supervisorId: string) => {
        setChatSupervisorId(supervisorId);
        setChatOpen(true);
    }, []);

    // Disponibiliza globalmente para notificações
    useEffect(() => {
        (window as any).openChatWithSupervisor = openChatWithSupervisor;
        return () => {
            delete (window as any).openChatWithSupervisor;
        };
    }, [openChatWithSupervisor]);

    // Listener para mensagens do service worker (notificações clicadas)
    useEffect(() => {
        const handleServiceWorkerMessage = (event: MessageEvent) => {
            if (event.data?.type === "NOTIFICATION_CLICK") {
                const { tag, action } = event.data;

                // Se for uma notificação de mensagem, abre o chat
                if (tag === "message") {
                    setChatOpen(true);
                    // Se houver supervisorId nos dados, seleciona o supervisor
                    if (event.data?.supervisorId) {
                        setChatSupervisorId(event.data.supervisorId);
                    }
                }
            }
        };

        navigator.serviceWorker?.addEventListener(
            "message",
            handleServiceWorkerMessage
        );

        return () => {
            navigator.serviceWorker?.removeEventListener(
                "message",
                handleServiceWorkerMessage
            );
        };
    }, []);

    const loadData = useCallback(async () => {
        await fetchTickets(1, 10);
        await fetchReasonsData();
    }, [fetchTickets, fetchReasonsData]);

    // Ativa o tableStore ao montar e desativa ao desmontar
    useEffect(() => {
        setActive(true);
        loadData();

        return () => {
            setActive(false);
        };
    }, [setActive, loadData]);

    const totalBreakSeconds = useMemo(() => {
        return reasonsData.reduce(
            (acc, r) => acc + (r.durationInSeconds ?? 0),
            0
        );
    }, [reasonsData]);
    const handlePageChange = (newPage: number) => {
        fetchTickets(newPage, tickets.pagination.limit);
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Stats Header */}
            <StatsHeader
                totalCalls={tickets.pagination.total}
                totalBreaks={totalBreakSeconds}
                averageTime={
                    reasonsData.length > 0
                        ? totalBreakSeconds / reasonsData.length
                        : 0
                }
                reasons={reasonsData}
                allReasonsMetadata={allReasonsMetadata}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-4 h-full">
                    <div className="xl:col-span-2 flex flex-col overflow-hidden">
                        <div className="bg-card/50 backdrop-blur-sm border border-glass-border rounded-xl shadow-soft hover:shadow-glow transition-all duration-300 h-full">
                            <CallsTable
                                tickets={tickets.data}
                                pagination={tickets.pagination}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col overflow-hidden">
                        <div className="bg-card/50 backdrop-blur-sm border border-glass-border rounded-xl shadow-soft hover:shadow-glow transition-all duration-300 h-full">
                            <BreaksTable pauses={reasonsData} />
                        </div>
                    </div>
                </div>
            </div>

            <PauseDialog
                open={isDialogBreakOpen}
                setOpen={setDialogBreakOpen}
            />

            <OpenChat
                setOpenDialogChat={setChatOpen}
                isPaused={isPaused}
                unreadCount={totalUnread}
            />
            {isChatOpen && (
                <SupervisorFloatingChat
                    open={isChatOpen}
                    onClose={() => {
                        setChatOpen(false);
                        setChatSupervisorId(null);
                    }}
                    onBack={() => {
                        setChatSupervisorId(null);
                    }}
                    isPaused={isPaused}
                    initialSupervisorId={chatSupervisorId}
                />
            )}

            {!isPaused && !isWaitingApproval && (
                <PauseButton setOpenDialogBreakReasons={setDialogBreakOpen} />
            )}
            {(isPaused || isWaitingApproval) && <PauseAlert />}
        </div>
    );
}
