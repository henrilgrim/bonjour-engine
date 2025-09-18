import {
    Clock,
    PhoneCall,
    Coffee,
    ThumbsUp,
    ThumbsDown,
    Flame,
} from "lucide-react";

interface StatsProps {
    totalCalls: number;
    totalBreaks?: number;
    averageTime?: number;
    productiveTime?: number;
    unproductiveTime?: number;
    mostCommonReason?: string;
}

export const Stats = ({
    totalCalls,
    totalBreaks,
    averageTime,
    productiveTime,
    unproductiveTime,
    mostCommonReason,
}: StatsProps) => {
    const convertSecondsToTime = (seconds: number) => {
        const total = Math.round(seconds);
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const secs = total % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return [
        {
            label: "Chamadas",
            value: String(totalCalls ?? ""),
            icon: PhoneCall,
            color: "text-blue-500",
        },
        {
            label: "Pausas Totais",
            value: convertSecondsToTime(totalBreaks),
            icon: Coffee,
            color: "text-green-500",
        },
        {
            label: "Tempo Médio",
            value: convertSecondsToTime(averageTime),
            icon: Clock,
            color: "text-yellow-500",
        },
        {
            label: "Média Pausas Produtiva",
            value: convertSecondsToTime(productiveTime),
            icon: ThumbsUp,
            color: "text-green-600",
        },
        {
            label: "Média Pausas Improdutiva",
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
};
