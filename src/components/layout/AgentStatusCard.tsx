import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/store/appStore";
import { useAgentsInPause } from "@/hooks/use-agents-in-pause";
import { CheckCircle2, XCircle, Users, Clock, UserCheck } from "lucide-react";

export function AgentStatusCard() {
    const agentState = useAppStore((s) => s.actualStateAgent);
    const { agentsInPause, loading: pauseLoading } = useAgentsInPause();

    if (!agentState?.queues?.length) {
        return null;
    }

    const loggedQueues = agentState.queues.filter((q) => q.status).length;
    const totalQueues = agentState.queues.length;
    const allQueuesActive = loggedQueues === totalQueues;

    return (
        <div className="space-y-3">
            {/* Status das Filas */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="group flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-surface-elevated/80 to-surface-elevated/60 backdrop-blur-md border border-glass-border rounded-xl hover:from-surface-hover/80 hover:to-surface-hover/60 transition-all duration-300 cursor-help shadow-soft">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground">
                                        Filas Ativas
                                    </span>
                                    {allQueuesActive ? (
                                        <CheckCircle2 className="h-4 w-4 text-success" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-destructive" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">
                                        {loggedQueues}/{totalQueues} filas
                                    </span>
                                    <Badge
                                        variant={
                                            allQueuesActive
                                                ? "default"
                                                : "destructive"
                                        }
                                        className="h-5 text-xs px-2"
                                    >
                                        {allQueuesActive ? "OK" : "ATENÇÃO"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent
                        side="right"
                        className="max-w-xs z-50 bg-popover/95 backdrop-blur-sm border border-border/50 shadow-xl"
                    >
                        <div className="space-y-3">
                            <p className="font-semibold text-sm">
                                Suas Filas de Atendimento
                            </p>
                            <div className="space-y-2">
                                {agentState.queues
                                    .sort((a, b) => b.priority - a.priority)
                                    .map((queue) => (
                                        <div
                                            key={queue.id}
                                            className="flex items-center justify-between gap-3 p-2 bg-muted/50 rounded-lg"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-medium text-foreground truncate block">
                                                    {queue.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    Prioridade: {queue.priority}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {queue.status ? (
                                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-destructive" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                            <div className="pt-2 border-t border-border/50">
                                <p className="text-xs text-muted-foreground">
                                    {allQueuesActive
                                        ? "✅ Todas as filas estão ativas e você pode receber chamadas"
                                        : `⚠️ ${
                                              totalQueues - loggedQueues
                                          } fila(s) inativa(s) - verifique suas configurações`}
                                </p>
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Agentes em Pausa */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="group flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-warning/5 to-warning/10 backdrop-blur-md border border-warning/20 rounded-xl hover:from-warning/10 hover:to-warning/15 transition-all duration-300 cursor-help">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10 group-hover:bg-warning/15 transition-colors">
                                <Clock className="h-5 w-5 text-warning" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground">
                                        Colegas em Pausa
                                    </span>
                                    <UserCheck className="h-4 w-4 text-warning" />
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">
                                        {pauseLoading ? "..." : agentsInPause}{" "}
                                        agente(s)
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="h-5 text-xs px-2 border-warning/30 text-warning"
                                    >
                                        {pauseLoading
                                            ? "..."
                                            : agentsInPause === 0
                                            ? "TODOS ATIVOS"
                                            : "EM PAUSA"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent
                        side="right"
                        className="max-w-xs z-50 bg-popover/95 backdrop-blur-sm border border-border/50 shadow-xl"
                    >
                        <div className="space-y-2">
                            <p className="font-semibold text-sm">
                                Status da Equipe
                            </p>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    {pauseLoading
                                        ? "Carregando informações da equipe..."
                                        : agentsInPause === 0
                                        ? "🟢 Todos os colegas estão ativos e disponíveis para atendimento"
                                        : agentsInPause === 1
                                        ? "🟡 1 colega está em pausa no momento"
                                        : `🟡 ${agentsInPause} colegas estão em pausa no momento`}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                                    💡 Esta informação ajuda você a entender a
                                    disponibilidade da equipe para atendimento.
                                </p>
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
