import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import {
    createNotification,
    listenAllNotifications,
    listenAgentNotifications,
    markNotificationAsRead,
    type Notification,
    type NotificationInput,
} from "@/lib/firebase/firestore/notifications";
import { toast } from "@/hooks/use-toast";

interface UseNotificationsOptions {
    accountcode: string;
    enabled?: boolean;
    agentOnly?: boolean; // Se true, só escuta notificações do agente atual
}

export function useNotifications({
    accountcode,
    enabled = true,
    agentOnly = false,
}: UseNotificationsOptions) {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Escutar notificações
    useEffect(() => {
        if (!accountcode || !enabled) return;

        const unsubscribe = agentOnly && user?.login
            ? listenAgentNotifications(accountcode, user.login, (list) => {
                setNotifications(list);
                setLoading(false);
            })
            : listenAllNotifications(accountcode, (list) => {
                setNotifications(list);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [accountcode, enabled, agentOnly, user?.login]);

    // Criar nova notificação
    const createNew = async (notification: NotificationInput) => {
        if (!user?.id || !user?.nome) {
            throw new Error("Usuário não autenticado");
        }

        try {
            setCreating(true);
            const notificationId = await createNotification(
                accountcode,
                notification,
                user.id,
                user.nome
            );

            toast({
                title: "Sucesso",
                description: `Notificação enviada para ${notification.targetAgents.length} agente${notification.targetAgents.length !== 1 ? 's' : ''}`,
            });

            return notificationId;
        } catch (error) {
            console.error("Erro ao criar notificação:", error);
            toast({
                title: "Erro",
                description: "Não foi possível enviar a notificação",
                variant: "destructive",
            });
            throw error;
        } finally {
            setCreating(false);
        }
    };

    // Marcar como lida
    const markAsRead = async (notificationId: string) => {
        if (!user?.login || !user?.nome) return;

        try {
            await markNotificationAsRead(
                accountcode,
                notificationId,
                user.login,
                user.nome
            );
        } catch (error) {
            console.error("Erro ao marcar notificação como lida:", error);
            toast({
                title: "Erro",
                description: "Não foi possível marcar como lida",
                variant: "destructive",
            });
        }
    };

    // Notificações não lidas para o agente atual
    const unreadNotifications = agentOnly && user?.login
        ? notifications.filter(notification =>
            !notification.readBy?.[user.login]
        )
        : [];

    // Estatísticas
    const stats = {
        total: notifications.length,
        unread: unreadNotifications.length,
        read: notifications.length - unreadNotifications.length,
    };

    return {
        notifications,
        unreadNotifications,
        loading,
        creating,
        stats,
        createNotification: createNew,
        markAsRead,
    };
}