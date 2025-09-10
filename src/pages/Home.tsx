import { useEffect, useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PauseDialog, PauseAlert, PauseButton } from "@/components/pause";

import { BreaksTable } from "@/components/home/BreaksTable";
import { CallsTable } from "@/components/home/CallsTable";
import { StatsHome } from "@/components/home/StatsHome";

import OpenChat from "@/components/specific-buttons/OpenChat";

import { usePauseControl } from "@/hooks/use-pause-control";
import { useTotalUnreadCount } from "@/hooks/use-total-unread-count";

import { useTableStore } from "@/store/tableStore";
import { useReasonStore } from "@/store/reasonStore";
import { useCoreStore } from "@/store/coreStore";
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

    const isStatsVisible = useCoreStore((s) => s.isStatsVisible);
    const toggle = useCoreStore((s) => s.toggleStats);

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
        <div className="flex overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
            <div className="flex-1 flex-col grid grid-cols-1 xl:grid-cols-3 gap-4 p-4 min-h-0">
                <div className="xl:col-span-2 flex flex-col overflow-hidden">
                    <div className="bg-card/50 backdrop-blur-sm border border-glass-border rounded-xl shadow-soft hover:shadow-glow transition-all duration-300">
                        <CallsTable
                            tickets={tickets.data}
                            pagination={tickets.pagination}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>

                <div className="flex flex-col overflow-hidden">
                    <div className="bg-card/50 backdrop-blur-sm border border-glass-border rounded-xl shadow-soft hover:shadow-glow transition-all duration-300">
                        <BreaksTable pauses={reasonsData} />
                    </div>
                </div>
            </div>

            {/* Controles da sidebar com design moderno */}
            <div className="shrink-0 flex flex-col items-start pt-6 space-y-3 pr-2">
                <button
                    onClick={toggle}
                    className="guide--pinned-stats group p-3 bg-surface-elevated/80 backdrop-blur-md hover:bg-surface-hover border border-glass-border rounded-l-xl transition-all duration-300 shadow-soft hover:shadow-glow hover:scale-105"
                    title={
                        isStatsVisible
                            ? "Ocultar estatísticas"
                            : "Mostrar estatísticas"
                    }
                >
                    {isStatsVisible ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    ) : (
                        <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                </button>
            </div>

            <div
                className={`transition-all duration-500 ease-out ${
                    isStatsVisible ? "w-72" : "w-0"
                } shrink-0 overflow-hidden`}
            >
                <div className="h-full bg-surface-elevated/60 backdrop-blur-xl border-l border-glass-border relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

                    <div className="relative h-full p-6 flex flex-col min-h-0">
                        <StatsHome
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
