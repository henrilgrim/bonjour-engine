import { useState, useEffect, useRef } from "react";
import {
    listenAgentNotifications,
    type Notification,
} from "@/lib/firebase/firestore/notifications";
import { usePwaNotifications } from "./use-pwa-notifications";
import { useAuthStore } from "@/store/authStore";

interface UseSystemNotificationsOptions {
    accountcode: string;
    enabled?: boolean;
}

const keyOf = (notification: Notification) =>
    `${notification.id}-${notification.createdAt}`;

export function useSystemNotifications({
    accountcode,
    enabled = true,
}: UseSystemNotificationsOptions) {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const previousKeysRef = useRef<Set<string>>(new Set());
    const { showNotification } = usePwaNotifications();

    useEffect(() => {
        if (!accountcode || !enabled || !user?.login) return;

        const unsubscribe = listenAgentNotifications(accountcode, user.login, (list) => {
            const currentKeys = new Set(list.map(keyOf));
            const newKeys = Array.from(currentKeys).filter(
                (key) => !previousKeysRef.current.has(key)
            );

            // Disparar notificações PWA para novas notificações
            if (newKeys.length > 0) {
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
                            type: "system-notification",
                        },
                    });
                });
            }

            previousKeysRef.current = currentKeys;
            setNotifications(list);
        });

        return () => unsubscribe();
    }, [accountcode, enabled, user?.login, showNotification]);

    const unreadCount = notifications.filter(
        notification => !notification.readBy?.[user?.login || ""]
    ).length;

    return {
        notifications,
        unreadCount,
        count: notifications.length,
    };
}