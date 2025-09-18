export type NotificationType = "message" | "pause" | "system";

export type NotificationVariant = "info" | "success" | "error" | "warning";

export type NotificationIcon = "check" | "alert" | "pause" | "cancel" | "message";

export interface NotificationConfig {
    messageNotifications: boolean;
    pauseNotifications: boolean;
    systemNotifications: boolean;
    soundType: string;
    volume: number;
}

export interface CentralNotification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    timestamp: Date;
    variant?: NotificationVariant;
    icon?: NotificationIcon;
    duration?: number;
    senderName?: string;
    data?: Record<string, any>;
}

export interface NotificationActionDef {
    action: string;
    title: string;
    icon?: string;
}

export interface PWANotificationOptions {
    title: string;
    body?: string;
    icon?: string;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    data?: any;
    actions?: NotificationActionDef[];
}

export interface NotificationPermissions {
    canShow: boolean;
    permission: NotificationPermission;
}