import React, { useEffect } from "react";
import {
    X,
    MessageCircle,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/lib/notifications/store";
import type { CentralNotification } from "@/lib/notifications/types";

const iconMap = {
    message: MessageCircle,
    alert: AlertTriangle,
    check: CheckCircle,
    cancel: XCircle,
    pause: AlertTriangle,
    info: Info,
};

const variantStyles = {
    info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100",
    success:
        "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
    warning:
        "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100",
    error: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100",
};

interface NotificationItemProps {
    notification: CentralNotification;
    onRemove: (id: string) => void;
}

function NotificationItem({ notification, onRemove }: NotificationItemProps) {
    const Icon = iconMap[notification.icon] || Info;
    const variant = notification.variant || "info";

    useEffect(() => {
        // Auto-remove após 8 segundos
        const timer = setTimeout(() => {
            onRemove(notification.id);
        }, 8000);

        return () => clearTimeout(timer);
    }, [notification.id, onRemove]);

    return (
        <div
            className={cn(
                "relative flex items-start gap-3 p-4 rounded-lg border shadow-sm animate-in slide-in-from-right-full",
                variantStyles[variant]
            )}
            role="alert"
            aria-live="polite"
        >
            <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />

            <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{notification.title}</div>
                {notification.message && (
                    <div className="text-sm opacity-90 mt-1">
                        {notification.message}
                    </div>
                )}
                {notification.senderName && (
                    <div className="text-xs opacity-75 mt-1">
                        De: {notification.senderName}
                    </div>
                )}
            </div>

            <button
                onClick={() => onRemove(notification.id)}
                className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Fechar notificação"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

export function NotificationDisplay() {
    const { notifications, removeNotification, isVisible, isFocused } = useNotificationStore();

    // Filtra mensagens quando usuário não está na tela
    const isPageActive = isVisible && isFocused;
    const visibleNotifications = notifications.filter(notification => {
        // Se usuário não está na tela, não mostra notificações de mensagem
        if (!isPageActive && notification.type === "message") {
            return false;
        }
        return true;
    });

    if (visibleNotifications.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-[100] w-96 max-w-[calc(100vw-2rem)] space-y-2">
            {visibleNotifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRemove={removeNotification}
                />
            ))}
        </div>
    );
}
