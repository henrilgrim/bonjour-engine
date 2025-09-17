import { useState, useEffect, useRef } from "react";
import {
    listenAgentNotifications,
    markNotificationAsRead,
    type Notification,
} from "@/lib/firebase/firestore/notifications";
import { usePwaNotifications } from "./use-pwa-notifications";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/hooks/use-toast";

interface UseFirebaseNotificationsOptions {
    accountcode: string;
    enabled?: boolean;
}

const keyOf = (notification: Notification) =>
    `${notification.id}-${notification.createdAt}`;

export function useFirebaseNotifications({
    accountcode,
    enabled = true,
}: UseFirebaseNotificationsOptions) {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const previousKeysRef = useRef<Set<string>>(new Set());
    const { showNotification } = usePwaNotifications();

    useEffect(() => {
        if (!accountcode || !enabled || !user?.login) {
            setLoading(false);
            return;
        }

        const unsubscribe = listenAgentNotifications(accountcode, user.login, (list) => {
            const currentKeys = new Set(list.map(keyOf));
            const newKeys = Array.from(currentKeys).filter(
                (key) => !previousKeysRef.current.has(key)
            );

            // Disparar notificações PWA para novas notificações
            if (newKeys.length > 0 && previousKeysRef.current.size > 0) {
                const newNotifications = list.filter((notification) =>
                    newKeys.includes(keyOf(notification))
                );

                newNotifications.forEach((notification) => {
                    showNotification({
                        title: notification.title,
                        body: notification.message,
                        playSound: true,
                        actions: [
                            {
                                action: "view",
                                title: "Ver Notificação",
                                icon: "/favicon.png",
                            },
                        ],
                        data: {
                            notificationId: notification.id,
                            accountcode,
                            type: "firebase-notification",
                        },
                    });
                });
            }

            previousKeysRef.current = currentKeys;
            setNotifications(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [accountcode, enabled, user?.login, showNotification]);

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

    const unreadNotifications = notifications.filter(
        (notification) => !notification.readBy?.[user?.login || ""]
    );

    return {
        notifications,
        unreadNotifications,
        unreadCount: unreadNotifications.length,
        loading,
        markAsRead,
    };
}