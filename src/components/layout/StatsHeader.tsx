import {
    Clock,
    PhoneCall,
    Coffee,
    ThumbsUp,
    ThumbsDown,
    Flame,
} from "lucide-react";
import { useMemo } from "react";
import { Reason } from "@/types";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReasonData {
    reason: string;
    durationInSeconds: number;
}

interface StatsHeaderProps {
    totalCalls: number;
    totalBreaks?: number;
    averageTime?: number;
    reasons?: ReasonData[];
    allReasonsMetadata?: Reason[];
}

export function StatsHeader({
    totalCalls,
    totalBreaks = 0,
    averageTime = 0,
    reasons = [],
    allReasonsMetadata = [],
}: StatsHeaderProps) {
    const formatTime = (seconds: number): string => {
        const total = Math.round(seconds);
        const h = Math.floor(total / 3600)
            .toString()
            .padStart(2, "0");
        const m = Math.floor((total % 3600) / 60)
            .toString()
            .padStart(2, "0");
        const s = (total % 60).toString().padStart(2, "0");
        return `${h}:${m}:${s}`;
    };

    const { productiveAvg, unproductiveAvg, mostCommonReason } = useMemo(() => {
        const grouped = new Map<
            string,
            { total: number; count: number; productive: boolean }
        >();

        let prodTotal = 0,
            prodCount = 0;
        let imprTotal = 0,
            imprCount = 0;

        for (const { reason, durationInSeconds } of reasons) {
            const meta = allReasonsMetadata.find((r) => r.name === reason);
            const isProductive = meta?.productivePause ?? false;

            if (!grouped.has(reason)) {
                grouped.set(reason, {
                    total: 0,
                    count: 0,
                    productive: isProductive,
                });
            }

            const entry = grouped.get(reason)!;
            entry.total += durationInSeconds;
            entry.count += 1;

            if (isProductive) {
                prodTotal += durationInSeconds;
                prodCount++;
            } else {
                imprTotal += durationInSeconds;
                imprCount++;
            }
        }

        const mostUsed =
            Array.from(grouped.entries()).sort(
                (a, b) => b[1].count - a[1].count
            )?.[0]?.[0] ?? "—";

        return {
            productiveAvg: prodCount ? prodTotal / prodCount : 0,
            unproductiveAvg: imprCount ? imprTotal / imprCount : 0,
            mostCommonReason: mostUsed,
        };
    }, [reasons, allReasonsMetadata]);

    const stats = [
        {
            label: "Total de Chamadas",
            labelTooltip: "Quantidade Total de Chamadas",
            value: String(totalCalls),
            icon: PhoneCall,
            color: "text-blue-500",
        },
        {
            label: "Total de Pausas",
            labelTooltip: "Tempo Total de Pausas",
            value: formatTime(totalBreaks),
            icon: Coffee,
            color: "text-green-500",
        },
        {
            label: "Tempo Médio",
            labelTooltip: "Tempo Médio de Todas as Pausas",
            value: formatTime(averageTime),
            icon: Clock,
            color: "text-yellow-500",
        },
        {
            label: "Média Produtiva",
            labelTooltip: "Tempo Médio de Pausas Produtivas",
            value: formatTime(productiveAvg),
            icon: ThumbsUp,
            color: "text-green-600",
        },
        {
            label: "Média Improdutiva",
            labelTooltip: "Tempo Médio de Pausas Improdutivas",
            value: formatTime(unproductiveAvg),
            icon: ThumbsDown,
            color: "text-red-500",
        },
        {
            label: "Mais Frequente",
            labelTooltip: "Pausa Mais Frequente",
            value: mostCommonReason,
            icon: Flame,
            color: "text-purple-500",
        },
    ];

    return (
        <section className="w-full">
            <TooltipProvider delayDuration={100}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {stats.map(
                        (
                            { label, labelTooltip, value, icon: Icon, color },
                            index
                        ) => (
                            <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                    <div className="group flex items-center gap-3 p-3 bg-card/60 backdrop-blur-md border border-border/40 rounded-lg hover:bg-card/80 hover:border-primary/20 transition-all duration-200 hover:scale-[1.01] cursor-default">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 group-hover:border-primary/20 transition-all duration-200">
                                            <Icon
                                                className={`w-4 h-4 ${color} group-hover:scale-110 transition-transform`}
                                            />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[11px] text-muted-foreground font-medium truncate">
                                                {label}
                                            </span>
                                            <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
                                                {value}
                                            </span>
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-medium">
                                        {labelTooltip}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {value}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        )
                    )}
                </div>
            </TooltipProvider>
        </section>
    );
}
