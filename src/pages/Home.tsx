import { useEffect, useState, useCallback } from "react";

import { PauseDialog, PauseAlert, PauseButton } from "@/components/pause";

import { BreaksTable } from "@/components/home/BreaksTable";
import { CallsTable } from "@/components/home/CallsTable";

import OpenChat from "@/components/specific-buttons/OpenChat";

import { usePauseControl } from "@/hooks/use-pause-control";
import { useTotalUnreadCount } from "@/hooks/use-total-unread-count";

import { useTableStore } from "@/store/tableStore";
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
    const { totalUnread } = useTotalUnreadCount();
    // const softphoneEnabled = useAppStore((s) => s.softphoneEnabled);

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

    useEffect(() => {
        document.title = "PxTalk - Painel do Agente";
    }, []);

    const handlePageChange = (newPage: number) => {
        fetchTickets(newPage, tickets.pagination.limit);
    };

    return (
        <div className="h-full bg-gradient-to-br from-background via-background to-muted/30">
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 h-full">
                {/* Tabela de Chamadas - ocupa 3/5 */}
                <div className="flex flex-col overflow-hidden lg:col-span-4">
                    <div className="bg-card/60 backdrop-blur-sm border border-glass-border rounded-xl shadow-soft hover:shadow-glow transition-all duration-300 h-full relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-xl" />
                        <div className="relative z-10 h-full">
                            <CallsTable
                                tickets={tickets.data}
                                pagination={tickets.pagination}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Tabela de Pausas - ocupa 2/5 */}
                <div className="flex flex-col overflow-hidden lg:col-span-2">
                    <div className="bg-card/60 backdrop-blur-sm border border-glass-border rounded-xl shadow-soft hover:shadow-glow transition-all duration-300 h-full relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-muted/10 rounded-xl" />
                        <div className="relative z-10 h-full">
                            <BreaksTable pauses={reasonsData} />
                        </div>
                    </div>
                </div>
            </div>

            <PauseDialog
                open={isDialogBreakOpen}
                setOpen={setDialogBreakOpen}
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

            {/* softphoneEnabled */}
            <div>
                <OpenChat
                    setOpenDialogChat={setChatOpen}
                    isPaused={isPaused}
                    unreadCount={totalUnread}
                />

                {!isPaused && !isWaitingApproval && (
                    <PauseButton
                        setOpenDialogBreakReasons={setDialogBreakOpen}
                    />
                )}
            </div>

            {(isPaused || isWaitingApproval) && <PauseAlert />}
        </div>
    );
}
