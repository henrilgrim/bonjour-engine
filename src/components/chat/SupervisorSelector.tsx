import { useMemo, KeyboardEvent } from "react";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    SupervisorOnline,
    useFirebaseSupervisors,
} from "@/hooks/use-firebase-supervisors";
import { useTotalUnreadCount } from "@/hooks/use-total-unread-count";

import { cn } from "@/lib/utils";

interface SupervisorSelectorProps {
    onSelectSupervisor: (supervisor: SupervisorOnline) => void;
}

type SupervisorWithUnread = SupervisorOnline & { unreadCount: number };

export function SupervisorSelector({
    onSelectSupervisor,
}: SupervisorSelectorProps) {
    const { supervisors, loading } = useFirebaseSupervisors();
    const { unreadBySupervisor } = useTotalUnreadCount();

    const list: SupervisorWithUnread[] = useMemo(() => {
        const map = new Map(
            unreadBySupervisor.map((u) => [u.supervisorId, u.count])
        );
        // monta e ordena: não lidas desc, online primeiro, nome asc
        return supervisors
            .map((s) => ({ ...s, unreadCount: map.get(s.id) ?? 0 }))
            .sort((a, b) => {
                if ((b.unreadCount ?? 0) !== (a.unreadCount ?? 0))
                    return (b.unreadCount ?? 0) - (a.unreadCount ?? 0);
                const onlineA = a.status === "logged" ? 1 : 0;
                const onlineB = b.status === "logged" ? 1 : 0;
                if (onlineB !== onlineA) return onlineB - onlineA;
                return a.name.localeCompare(b.name, "pt-BR");
            });
    }, [supervisors, unreadBySupervisor]);

    const handleSelect = (supervisor: SupervisorOnline) => {
        onSelectSupervisor(supervisor);
    };

    const onKey = (e: KeyboardEvent, sup: SupervisorOnline) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelect(sup);
        }
    };

    const getStatusColor = (status: SupervisorOnline["status"]) =>
        status === "logged" ? "bg-green-500" : "bg-gray-400";

    const getStatusText = (status: SupervisorOnline["status"]) =>
        status === "logged"
            ? "Online"
            : status === "offline"
            ? "Offline"
            : "Desconhecido";

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
                <p className="text-muted-foreground">
                    Carregando supervisores...
                </p>
            </div>
        );
    }

    if (list.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                    Nenhum supervisor disponível
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                    Tente novamente mais tarde
                </p>
            </div>
        );
    }

    const onlineCount = list.filter((s) => s.status === "logged").length;

    return (
        <div className="space-y-4">
            <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">Selecionar Supervisor</h3>
                <p className="text-sm text-muted-foreground">
                    Escolha com qual supervisor você deseja conversar
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                    {onlineCount} online · {list.length} total
                </div>
            </div>

            <div className="space-y-3">
                {list.map((supervisor) => {
                    const initials = supervisor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                    return (
                        <Card
                            key={supervisor.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelect(supervisor)}
                            onKeyDown={(e) => onKey(e, supervisor)}
                            className={cn(
                                "cursor-pointer transition-all hover:shadow-md hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                            )}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span
                                            className={cn(
                                                "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                                                getStatusColor(
                                                    supervisor.status
                                                )
                                            )}
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium truncate">
                                                {supervisor.name}
                                            </p>

                                            {/* Só renderiza se > 0 */}
                                            {supervisor.unreadCount > 0 && (
                                                <Badge
                                                    variant="destructive"
                                                    className="ml-auto h-5 px-2 text-xs"
                                                >
                                                    {supervisor.unreadCount > 9
                                                        ? "9+"
                                                        : supervisor.unreadCount}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="mt-0.5 text-xs text-muted-foreground">
                                            {getStatusText(supervisor.status)}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
