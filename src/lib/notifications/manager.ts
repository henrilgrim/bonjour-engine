import { playAlert, type AlertType } from "@/lib/sfx/alerts";
import type { 
    CentralNotification, 
    NotificationConfig, 
    PWANotificationOptions,
    NotificationPermissions 
} from "./types";

export class NotificationManager {
    private static instance: NotificationManager;
    private permission: NotificationPermission = "default";
    private sentNotifications = new Set<string>();
    private activeNotifications = new Map<string, Notification>();

    private constructor() {
        this.initializePermission();
    }

    static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    private initializePermission(): void {
        if (typeof window !== "undefined" && "Notification" in window) {
            this.permission = Notification.permission;
        }
    }

    async getPermissions(): Promise<NotificationPermissions> {
        if (typeof window === "undefined" || !("Notification" in window)) {
            return { canShow: false, permission: "denied" };
        }

        this.permission = Notification.permission;
        return {
            canShow: this.permission === "granted",
            permission: this.permission
        };
    }

    async requestPermission(): Promise<boolean> {
        if (typeof window === "undefined" || !("Notification" in window)) {
            return false;
        }

        if (this.permission === "granted") {
            return true;
        }

        try {
            this.permission = await Notification.requestPermission();
            return this.permission === "granted";
        } catch (error) {
            console.error("Erro ao solicitar permissão de notificação:", error);
            return false;
        }
    }

    canSendNotifications(): boolean {
        return typeof window !== "undefined" && 
               "Notification" in window && 
               this.permission === "granted";
    }

    private createNativeNotification(options: PWANotificationOptions): Notification | null {
        if (!this.canSendNotifications()) {
            return null;
        }

        const defaultOptions: NotificationOptions = {
            icon: "/favicon.png",
            badge: "/favicon.png",
            tag: options.tag || "px-agent",
            body: options.body || "",
            requireInteraction: options.requireInteraction || false,
            silent: options.silent || true,
            data: options.data,
        };

        try {
            const notification = new Notification(options.title, defaultOptions);

            // Focar a aba quando clicar na notificação
            notification.onclick = (event: Event) => {
                try {
                    (event as any).preventDefault?.();
                    window.focus();
                    notification.close();

                    // Se há dados de supervisor, tenta abrir o chat
                    if (options.data?.supervisorId) {
                        const openChatFn = (window as any).openChatWithSupervisor;
                        if (typeof openChatFn === "function") {
                            openChatFn(options.data.supervisorId);
                        }
                    }
                } catch (error) {
                    console.error("Erro ao processar clique na notificação:", error);
                }
            };

            // Gerenciar notificações ativas
            if (options.tag) {
                this.activeNotifications.set(options.tag, notification);
            }

            // Auto-fechar após 8 segundos
            setTimeout(() => {
                try {
                    notification.close();
                    if (options.tag) {
                        this.activeNotifications.delete(options.tag);
                    }
                } catch (error) {
                    // Ignore errors when closing notifications
                }
            }, 8000);

            return notification;
        } catch (error) {
            console.error("Erro ao criar notificação nativa:", error);
            return null;
        }
    }

    sendMessageNotification(
        senderName: string,
        message: string,
        supervisorName?: string,
        supervisorId?: string
    ): void {
        const title = supervisorName ? `Mensagem de ${supervisorName}` : "Nova mensagem";
        const body = `${senderName}: ${message.length > 100 ? message.substring(0, 100) + "..." : message}`;

        this.createNativeNotification({
            title,
            body,
            tag: "message",
            requireInteraction: true,
            silent: false,
            data: { supervisorId }
        });
    }

    sendPauseNotification(
        type: "approved" | "rejected" | "warning" | "exceeded",
        reasonName: string,
        additionalInfo?: string
    ): void {
        const notifications = {
            approved: {
                title: "✅ Pausa aprovada",
                body: `Sua solicitação foi aprovada: ${reasonName}`,
                tag: "pause-approved"
            },
            rejected: {
                title: "❌ Pausa rejeitada", 
                body: additionalInfo ? `${additionalInfo}` : `Sua solicitação foi rejeitada: ${reasonName}`,
                tag: "pause-rejected"
            },
            warning: {
                title: "⚠️ Pausa quase no limite",
                body: `Motivo: ${reasonName}\nTempo restante: ${additionalInfo}`,
                tag: "pause-warning"
            },
            exceeded: {
                title: "⏰ Tempo de pausa excedido",
                body: `Motivo: ${reasonName}\nTempo excedido: ${additionalInfo}`,
                tag: "pause-exceeded"
            }
        };

        const config = notifications[type];
        this.createNativeNotification({
            title: config.title,
            body: config.body,
            tag: config.tag,
            requireInteraction: type === "rejected" || type === "exceeded"
        });
    }

    sendSystemNotification(title: string, message?: string): void {
        this.createNativeNotification({
            title,
            body: message,
            tag: "system"
        });
    }

    playNotificationSound(
        type: "message" | "pause" | "system" | "breakExceeded" | "warning" | "approved" | "rejected",
        config: NotificationConfig
    ): void {
        try {
            // Verifica se o tipo de notificação está habilitado
            const isTypeEnabled = 
                (type === "message" && config.messageNotifications) ||
                (["pause", "breakExceeded", "warning", "approved", "rejected"].includes(type) && config.pauseNotifications) ||
                (type === "system" && config.systemNotifications);

            if (!isTypeEnabled) {
                console.log(`Som não reproduzido: tipo '${type}' desabilitado`);
                return;
            }

            // Converte volume de 0-100 para 0-1
            const normalizedVolume = config.volume / 100;

            // Mapeia tipos para sons apropriados
            const soundMap: Record<typeof type, AlertType> = {
                message: "soft",
                pause: "soft", 
                system: "soft",
                breakExceeded: "breakExceeded",
                warning: "warning",
                approved: "success",
                rejected: "error"
            };

            const alertType = soundMap[type] || "soft";
            playAlert(alertType, { volume: normalizedVolume });

            console.log(`Som reproduzido: ${type} -> ${alertType} (volume: ${normalizedVolume})`);
        } catch (error) {
            console.error("Erro ao reproduzir som de notificação:", error);
        }
    }

    clearNotificationCache(): void {
        this.sentNotifications.clear();
        
        // Fecha todas as notificações ativas
        this.activeNotifications.forEach(notification => {
            try {
                notification.close();
            } catch (error) {
                // Ignore errors when closing
            }
        });
        this.activeNotifications.clear();
    }

    // Método para evitar notificações duplicadas
    isDuplicate(key: string): boolean {
        return this.sentNotifications.has(key);
    }

    markAsSent(key: string): void {
        this.sentNotifications.add(key);
        
        // Limita o cache para evitar vazamento de memória
        if (this.sentNotifications.size > 100) {
            const entries = Array.from(this.sentNotifications);
            this.sentNotifications.clear();
            entries.slice(-50).forEach(entry => this.sentNotifications.add(entry));
        }
    }
}

export const notificationManager = NotificationManager.getInstance();