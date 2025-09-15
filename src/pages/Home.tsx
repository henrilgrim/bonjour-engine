import { useState, useMemo } from "react";
import {
    Monitor,
    AlertTriangle,
    RefreshCcw,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealtimeAgents } from "@/hooks/use-realtime-agents";
import { useSelectedAgentsStore } from "@/store/selectedAgentsStore";

import { useCoreStore } from "@/store/coreStore";
import { PauseRequestNotifications } from "@/components/notifications/PauseRequestNotifications";
import { GlobalNotifications } from "@/components/notifications/GlobalNotifications";
import { useAgentMessageCounts } from "@/hooks/use-agent-message-counts";

import DashboardStats from "@/components/home/DashboardStats";
import CardAgent from "@/components/home/CardAgent";

export default function HomePage() {
    const { orderedAgents, stats, loading, error, refresh } =
        useRealtimeAgents();
    const { messageCounts, clearAgentCount } = useAgentMessageCounts();
    const { selectedAgents, hasSelection } = useSelectedAgentsStore();

    // === controle de seleção única e qual diálogo abrir ===
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedOpenChild, setSelectedOpenChild] = useState<
        "chat" | "pause-requests" | undefined
    >(undefined);

    const isVisible = useCoreStore((s) => s.isStatsVisible);
    const isHeaderVisible = useCoreStore((s) => s.isHeaderVisible);
    const toggle = useCoreStore((s) => s.toggleStats);
    const toggleHeader = useCoreStore((s) => s.toggleHeader);

    // abrir via notificações já apontando para o diálogo correto
    const handleOpenAgentByLogin = (
        agentLogin: string,
        initialChild: "chat" | "pause-requests"
    ) => {
        const agent = orderedAgents.find(
            (ag) => ag.id === agentLogin || ag.login === agentLogin
        );
        if (!agent) return;
        if (messageCounts[agent.login]) clearAgentCount(agent.login);

        // seleciona exclusivamente e agenda qual child abrir
        setSelectedId(agent.id);
        setSelectedOpenChild(initialChild);
    };

    const filteredAgents = useMemo(() => {
        // Se há agentes selecionados, filtrar apenas eles
        if (hasSelection && selectedAgents.length > 0) {
            const selectedIds = new Set(
                selectedAgents.map((agent) => agent.id)
            );
            return orderedAgents.filter((agent) => selectedIds.has(agent.id));
        }
        // Caso contrário, mostrar todos
        return orderedAgents;
    }, [orderedAgents, hasSelection, selectedAgents]);

    const getGridConfig = (count: number) => {
        let cardSize: "xlarge" | "large" | "medium" | "small" | "xsmall";

        if (count === 1) {
            // único agente → não gigante, não centralizado
            cardSize = "medium";
        } else if (count <= 4) cardSize = "xlarge";
        else if (count <= 8) cardSize = "large";
        else if (count <= 16) cardSize = "medium";
        else if (count <= 30) cardSize = "small";
        else cardSize = "xsmall";

        const gridAutoByCardSize: Record<typeof cardSize, string> = {
            xlarge: "grid-cols-[repeat(auto-fit,minmax(420px,1fr))]",
            large: "grid-cols-[repeat(auto-fit,minmax(360px,1fr))]",
            medium: "grid-cols-[repeat(auto-fit,minmax(300px,1fr))]",
            small: "grid-cols-[repeat(auto-fit,minmax(240px,1fr))]",
            xsmall: "grid-cols-[repeat(auto-fit,minmax(200px,1fr))]",
        };

        const gridClass = `${gridAutoByCardSize[cardSize]} gap-4 sm:gap-6 lg:gap-8`;
        return { gridClass, cardSize };
    };

    const { gridClass, cardSize } = getGridConfig(filteredAgents.length);

    if (loading) {
        return (
            <div className="w-full space-y-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground">
                            Carregando dados das filas...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full space-y-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">
                                Erro ao carregar dados
                            </h3>
                            <p className="text-muted-foreground max-w-md">
                                {error}
                            </p>
                            <Button
                                onClick={refresh}
                                variant="outline"
                                className="mt-4"
                            >
                                <RefreshCcw className="w-4 h-4 mr-2" />
                                Tentar novamente
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex flex-col ${
                isHeaderVisible ? "h-[calc(100vh-120px)]" : "h-screen"
            } overflow-hidden`}
        >
            <div className="sticky top-0 z-30 bg-surface-elevated/30 backdrop-blur-sm border-b border-glass-border">
                {/* Estatísticas */}
                <div
                    className={`transition-all duration-300 ease-out ${
                        isVisible
                            ? "max-h-[999px] opacity-100"
                            : "max-h-0 opacity-0"
                    } overflow-hidden`}
                >
                    <div className="pt-4">
                        <DashboardStats
                            totalAgents={stats.totalAgents}
                            availableAgents={stats.availableAgents}
                            busyAgents={stats.busyAgents}
                            ringingAgents={stats.ringingAgents}
                            waitingAgents={stats.waitingAgents}
                            pausedAgents={stats.pausedAgents}
                            unavailableAgents={stats.unavailableAgents}
                            totalQueueSize={stats.totalQueueSize}
                            loading={loading}
                        />
                    </div>
                </div>

                {/* Controles das estatísticas */}
                <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleHeader}
                            className="flex items-center gap-2"
                            title={
                                isHeaderVisible
                                    ? "Ocultar header"
                                    : "Mostrar header"
                            }
                        >
                            {isHeaderVisible ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                            {isHeaderVisible
                                ? "Ocultar header"
                                : "Mostrar header"}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggle}
                            className="flex items-center gap-2"
                            title={
                                isVisible
                                    ? "Ocultar estatísticas"
                                    : "Mostrar estatísticas"
                            }
                        >
                            {isVisible ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                            {isVisible
                                ? "Ocultar estatísticas"
                                : "Mostrar estatísticas"}
                        </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {filteredAgents.length} de {orderedAgents.length}{" "}
                        agentes
                    </div>
                </div>
            </div>

            {/* ÁREA SCROLLÁVEL: apenas os agentes rolam */}
            <div className="flex-1 min-h-0">
                {" "}
                {/* min-h-0 habilita scroll do filho dentro do flex */}
                <div
                    className={`h-full overflow-y-auto ${
                        filteredAgents.length === 1 ? "px-6 pt-2" : "p-2"
                    }`}
                >
                    {filteredAgents.length > 0 ? (
                        <div
                            className={`grid ${gridClass} w-full auto-rows-max`}
                        >
                            {filteredAgents.map((ag) => (
                                <CardAgent
                                    key={ag.id}
                                    ag={ag}
                                    messageCount={messageCounts[ag.login] || 0}
                                    isSelected={selectedId === ag.id}
                                    onSelect={(sel) => {
                                        setSelectedId(sel ? ag.id : null);
                                        if (!sel)
                                            setSelectedOpenChild(undefined);
                                    }}
                                    onDialogClose={() => {
                                        setSelectedOpenChild(undefined);
                                        clearAgentCount(ag.login);
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="p-6 rounded-full bg-muted/50 mb-6">
                                <Monitor className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <p className="text-lg text-muted-foreground">
                                Nenhum agente ativo no momento.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Notifications (fora do scroller de agentes) */}
            <PauseRequestNotifications
                onOpenAgentDialog={(agentLogin) =>
                    handleOpenAgentByLogin(agentLogin, "pause-requests")
                }
            />
            <GlobalNotifications
                onOpenAgentChat={(agentLogin) =>
                    handleOpenAgentByLogin(agentLogin, "chat")
                }
            />
        </div>
    );
}
