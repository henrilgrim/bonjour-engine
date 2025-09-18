import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/store/appStore";
import { CheckCircle2, XCircle, Users } from "lucide-react";

export function AgentQueuesInfo() {
    const agentState = useAppStore((s) => s.actualStateAgent);

    if (!agentState?.queues?.length) {
        return null;
    }

    const loggedQueues = agentState.queues.filter((q) => q.status).length;
    const totalQueues = agentState.queues.length;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-2 bg-surface-elevated/60 backdrop-blur-md border border-glass-border rounded-lg hover:bg-surface-hover transition-all duration-300 cursor-help">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                            Filas: {loggedQueues}/{totalQueues}
                        </span>
                        {loggedQueues === totalQueues ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-2">
                        <p className="font-medium text-sm">Filas do Agente</p>
                        <div className="space-y-1">
                            {agentState.queues
                                .sort((a, b) => b.priority - a.priority)
                                .map((queue) => (
                                    <div
                                        key={queue.id}
                                        className="flex items-center justify-between gap-2"
                                    >
                                        <span className="text-xs text-muted-foreground truncate">
                                            {queue.name}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Badge
                                                variant="outline"
                                                className="text-xs py-0"
                                            >
                                                P{queue.priority}
                                            </Badge>
                                            {queue.status ? (
                                                <CheckCircle2 className="h-3 w-3 text-success" />
                                            ) : (
                                                <XCircle className="h-3 w-3 text-destructive" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {loggedQueues === totalQueues
                                ? "Todas as filas estão ativas"
                                : `${
                                      totalQueues - loggedQueues
                                  } fila(s) inativa(s)`}
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
