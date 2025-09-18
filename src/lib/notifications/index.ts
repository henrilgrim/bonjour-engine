// Main exports
export { useNotifications, useSimpleNotifications } from "./hooks";
export { notificationManager } from "./manager";
export { useNotificationStore } from "./store";

// Types
export type {
    CentralNotification,
    NotificationType,
    NotificationVariant,
    NotificationIcon,
    NotificationConfig,
    PWANotificationOptions,
    NotificationPermissions,
} from "./types";

// Legacy compatibility function
import { useNotificationStore } from "./store";

export const systemNotify = (
    notification: Omit<import("./types").CentralNotification, "id" | "timestamp">
): string | undefined => {
    const store = useNotificationStore.getState();
    return store.addNotification(notification);
};