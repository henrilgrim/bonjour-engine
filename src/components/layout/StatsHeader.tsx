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
    const convertSecondsToTime = (seconds: number) => {
        const total = Math.round(seconds);
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const secs = total % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const { productiveTime, unproductiveTime, mostCommonReason } =
        useMemo(() => {
            const grouped: Record<
                string,
                { total: number; count: number; productive: boolean }
            > = {};

            let prodTotal = 0;
            let prodCount = 0;
            let imprTotal = 0;
            let imprCount = 0;

            for (const pause of reasons) {
                const meta = allReasonsMetadata.find(
                    (r) => r.name === pause.reason
                );
                const isProductive = meta?.productivePause ?? false;

                if (isProductive) {
                    prodTotal += pause.durationInSeconds;
                    prodCount += 1;
                } else {
                    imprTotal += pause.durationInSeconds;
                    imprCount += 1;
                }

                if (!grouped[pause.reason]) {
                    grouped[pause.reason] = {
                        total: 0,
                        count: 0,
                        productive: isProductive,
                    };
                }

                grouped[pause.reason].total += pause.durationInSeconds;
                grouped[pause.reason].count += 1;
            }

            let mostUsed =
                Object.entries(grouped).sort(
                    (a, b) => b[1].count - a[1].count
                )[0]?.[0] || "—";

            return {
                productiveTime: prodCount ? prodTotal / prodCount : 0,
                unproductiveTime: imprCount ? imprTotal / imprCount : 0,
                mostCommonReason: mostUsed,
            };
        }, [reasons, allReasonsMetadata]);

    const stats = [
        {
            label: "Pausas Totais",
            value: convertSecondsToTime(totalBreaks),
            icon: Coffee,
            color: "text-green-500",
        },
        {
            label: "Chamadas",
            value: String(totalCalls ?? ""),
            icon: PhoneCall,
            color: "text-blue-500",
        },
        {
            label: "Tempo Médio",
            value: convertSecondsToTime(averageTime),
            icon: Clock,
            color: "text-yellow-500",
        },
        {
            label: "Média Produtiva",
            value: convertSecondsToTime(productiveTime),
            icon: ThumbsUp,
            color: "text-green-600",
        },
        {
            label: "Média Improdutiva",
            value: convertSecondsToTime(unproductiveTime),
            icon: ThumbsDown,
            color: "text-red-500",
        },
        {
            label: "Mais frequente",
            value: mostCommonReason,
            icon: Flame,
            color: "text-purple-500",
        },
    ];

    return (
        <div className="bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
            <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            Estatísticas de Hoje
                        </h2>
                        <div className="w-12 h-0.5 bg-gradient-to-r from-primary to-transparent mt-2" />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={index}
                                className="group flex items-center gap-3 p-3 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl hover:bg-card/70 hover:border-primary/20 transition-all duration-300 hover:scale-[1.02]"
                            >
                                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 group-hover:border-primary/20 transition-all duration-300">
                                    <Icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground font-medium truncate mb-0.5">
                                        {stat.label}
                                    </p>
                                    <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors duration-300">
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}