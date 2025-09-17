import { NotificationCard } from "./NotificationCard";
import { CreateNotificationDialog } from "./CreateNotificationDialog";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";

interface NotificationsListProps {
    accountcode: string;
    agentOnly?: boolean;
    className?: string;
}

export function NotificationsList({
    agentOnly = false,
    className = "",
}: NotificationsListProps) {
    const { user } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState("");
    const accountcode = user.accountcode;

    const { notifications, loading, stats, markAsRead } = useNotifications({
        accountcode,
        agentOnly,
    });

    // Filtrar notificações baseado no termo de busca
    const filteredNotifications = useMemo(() => {
        if (!searchTerm) return notifications;

        return notifications.filter(
            (notification) =>
                notification.title
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                notification.message
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                notification.createdByName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
        );
    }, [notifications, searchTerm]);

    // Skeleton loader
    const renderSkeleton = () => (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-48" />
                </div>
                {!agentOnly && <Skeleton className="h-10 w-32" />}
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 bg-muted rounded-lg">
                        <Skeleton className="h-8 w-12 mx-auto mb-2" />
                        <Skeleton className="h-4 w-16 mx-auto" />
                    </div>
                ))}
            </div>

            <Skeleton className="h-10 w-full" />

            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                            <Skeleton className="h-9 w-32" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (loading) {
        return renderSkeleton();
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Bell className="h-6 w-6 text-primary" />
                    <div>
                        <h2 className="text-2xl font-bold">
                            {agentOnly
                                ? "Minhas Notificações"
                                : "Todas as Notificações"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {agentOnly
                                ? "Suas notificações pessoais"
                                : "Gerencie todas as notificações do sistema"}
                        </p>
                    </div>
                    {stats.unread > 0 && (
                        <Badge variant="destructive">
                            {stats.unread} nova{stats.unread !== 1 ? "s" : ""}
                        </Badge>
                    )}
                </div>

                {!agentOnly && (
                    <CreateNotificationDialog accountcode={accountcode}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Notificação
                        </Button>
                    </CreateNotificationDialog>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold text-primary">
                        {stats.total}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Total de Notificações
                    </div>
                </div>
                {agentOnly && (
                    <>
                        <div className="p-4 rounded-lg border bg-card">
                            <div className="text-2xl font-bold text-destructive">
                                {stats.unread}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Não Lidas
                            </div>
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                            <div className="text-2xl font-bold text-green-600">
                                {stats.read}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Lidas
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Search Filter */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Buscar por título, mensagem ou autor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">
                        {searchTerm
                            ? "Nenhuma notificação encontrada"
                            : "Nenhuma notificação"}
                    </h3>
                    <p className="text-muted-foreground">
                        {searchTerm
                            ? "Tente ajustar os filtros de busca"
                            : "Quando houver notificações, elas aparecerão aqui"}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredNotifications.map((notification) => (
                        <NotificationCard
                            key={notification.id}
                            notification={notification}
                            currentUserLogin={
                                agentOnly ? user?.login : undefined
                            }
                            onMarkAsRead={
                                agentOnly &&
                                user?.login &&
                                !notification.readBy?.[user.login]
                                    ? () => markAsRead(notification.id)
                                    : undefined
                            }
                            showReadStatus={!agentOnly}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
