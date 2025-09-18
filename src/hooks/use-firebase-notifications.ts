import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import {
    listenAgentNotifications,
    markNotificationAsRead,
    type Notification,
} from "@/lib/firebase/firestore/notifications";

export function useFirebaseNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const { userFirebase, user } = useAuthStore();
    const { company } = useAppStore();

    const markAsRead = useCallback(
        async (notificationId: string) => {
            if (
                !company?.accountcode ||
                !userFirebase?.userId ||
                !userFirebase?.name
            ) {
                return;
            }

            try {
                await markNotificationAsRead(
                    company.accountcode,
                    notificationId,
                    user.login,
                    userFirebase.name
                );

                // Remove da lista local
                setNotifications((prev) =>
                    prev.filter((n) => n.id !== notificationId)
                );
            } catch (error) {
                console.error("Erro ao marcar notificação como lida:", error);
            }
        },
        [company?.accountcode, user?.login, userFirebase?.name]
    );

    useEffect(() => {
        if (!company?.accountcode || !user?.login) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = listenAgentNotifications(
            company.accountcode,
            user.login,
            (newNotifications) => {
                setNotifications(newNotifications);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [company?.accountcode, user?.login]);

    return {
        notifications,
        loading,
        markAsRead,
        hasNotifications: notifications.length > 0,
        notificationCount: notifications.length,
    };
}
