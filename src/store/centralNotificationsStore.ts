import { useCallback, useEffect, useRef, useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { ChatMessage } from "@/lib/firebase/firestore/chats/types";

import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";

import { useNotificationsConfig } from "@/hooks/use-notifications-config";
import {
    useFirebaseSupervisors,
    SupervisorOnline,
} from "@/hooks/use-firebase-supervisors";
import {
    listenPauseRequestStatus,
    type PauseRequestPayload,
} from "@/lib/firebase/realtime/pause/request";
import { playAlert, type AlertType } from "@/lib/sfx/alerts";

export type NotificationType = "message" | "pause" | "system";

export interface CentralNotification {
    id?: string;
    type: NotificationType;
    title: string;
    message?: string;
    timestamp: Date;
    variant?: "info" | "success" | "error" | "warning";
    icon?: "check" | "alert" | "pause" | "cancel" | "message";
    duration?: number;
    senderName?: string;
    data?: Record<string, any>;
}

interface NotificationStore {
    notifications: CentralNotification[];
    isVisible: boolean;
    isFocused: boolean;
    viewedMessages: Set<string>; // Para rastrear mensagens já visualizadas
    previewedMessages: Set<string>; // Para rastrear mensagens já previsualizadas
    addNotification: (
        notification: Omit<CentralNotification, "id" | "timestamp">
    ) => string;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    setPageVisibility: (isVisible: boolean, isFocused: boolean) => void;
    markMessageAsViewed: (messageId: string) => void;
    isMessageViewed: (messageId: string) => boolean;
    markMessageAsPreviewed: (messageId: string) => void;
    isMessagePreviewed: (messageId: string) => boolean;
    clear: () => void;
}

export const useCentralNotificationStore = create<NotificationStore>()(
    persist(
        (set, get) => ({
            notifications: [],
            isVisible: true,
            isFocused: true,
            viewedMessages: new Set<string>(),
            previewedMessages: new Set<string>(),

            addNotification: (notification) => {
                // const id = crypto.randomUUID()
                const newNotification: CentralNotification = {
                    ...notification,
                    // id,
                    timestamp: new Date(),
                };

                set((state) => ({
                    notifications: [...state.notifications, newNotification],
                }));

                return newNotification.id || "";
            },

            removeNotification: (id) =>
                set((state) => ({
                    notifications: state.notifications.filter(
                        (n) => n.id !== id
                    ),
                })),

            clearAll: () => set({ notifications: [] }),

            setPageVisibility: (isVisible, isFocused) =>
                set({ isVisible, isFocused }),

            markMessageAsViewed: (messageId) =>
                set((state) => ({
                    viewedMessages: new Set([
                        ...state.viewedMessages,
                        messageId,
                    ]),
                })),

            isMessageViewed: (messageId) => get().viewedMessages.has(messageId),

            markMessageAsPreviewed: (messageId) =>
                set((state) => ({
                    previewedMessages: new Set([
                        ...state.previewedMessages,
                        messageId,
                    ]),
                })),

            isMessagePreviewed: (messageId) =>
                get().previewedMessages.has(messageId),
            clear: () =>
                set({
                    notifications: [],
                    isVisible: true,
                    isFocused: true,
                    viewedMessages: new Set<string>(),
                    previewedMessages: new Set<string>(),
                }),
        }),
        {
            name: "central-notifications-store",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                notifications: state.notifications.slice(-50), // Mantém apenas as últimas 50
                viewedMessages: Array.from(state.viewedMessages).slice(-100), // Mantém as últimas 100 mensagens visualizadas
                previewedMessages: Array.from(state.previewedMessages).slice(
                    -100
                ), // Mantém as últimas 100 mensagens previsualizadas
            }),
            merge: (persistedState: any, currentState) => ({
                ...currentState,
                ...persistedState,
                viewedMessages: new Set(persistedState?.viewedMessages || []),
                previewedMessages: new Set(
                    persistedState?.previewedMessages || []
                ),
            }),
        }
    )
);

// ======================
// PWA Notification Manager integrado
// ======================
class NotificationManager {
    private static instance: NotificationManager;
    private permission: NotificationPermission = "default";
    private sentNotifications = new Set<string>();

    private constructor() {
        this.checkPermission();
    }

    static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    private checkPermission() {
        if ("Notification" in window) {
            this.permission = Notification.permission;
        }
    }

    async requestPermission(): Promise<boolean> {
        if (!("Notification" in window)) {
            console.warn("Este navegador não suporta notificações");
            return false;
        }

        if (this.permission === "granted") {
            return true;
        }

        const permission = await Notification.requestPermission();
        this.permission = permission;

        return permission === "granted";
    }

    canSendNotifications(): boolean {
        return "Notification" in window && this.permission === "granted";
    }

    /**
     * ATUALIZADO: foca a aba quando o usuário clica na notificação nativa
     */
    sendNotification(
        title: string,
        options?: NotificationOptions
    ): Notification | null {
        if (!this.canSendNotifications()) {
            console.log("Cannot send notification: permission not granted");
            return null;
        }

        const defaultOptions: NotificationOptions = {
            icon: "/favicon.png",
            badge: "/favicon.png",
            tag: "px-agent",
            ...options,
        };

        const notif = new Notification(title, defaultOptions);

        // 🔹 Focar a aba/janela do app ao clicar
        notif.onclick = (event: Event) => {
            // Alguns navegadores precisam prevenir a navegação default
            try {
                (event as any).preventDefault?.();
            } catch {}
            try {
                window.focus();
            } catch {}
            try {
                notif.close();
            } catch {}

            // Se há dados de supervisor, tenta abrir o chat
            if ((notif as any).supervisorId) {
                const openChatFn = (window as any).openChatWithSupervisor;
                if (typeof openChatFn === "function") {
                    openChatFn((notif as any).supervisorId);
                }
            }
        };

        return notif;
    }

    sendMessageNotification(
        senderName: string,
        message: string,
        supervisorName?: string,
        supervisorId?: string
    ): void {
        const title = supervisorName
            ? `Mensagem de ${supervisorName}`
            : "Nova mensagem";
        const body = `${senderName}: ${
            message.length > 100 ? message.substring(0, 100) + "..." : message
        }`;

        const notif = this.sendNotification(title, {
            body,
            icon: "/favicon.png",
            tag: "message",
            requireInteraction: true,
            silent: false,
        });

        // Adiciona supervisorId à notificação para uso no callback
        if (notif && supervisorId) {
            (notif as any).supervisorId = supervisorId;
        }
    }

    sendBreakExceededNotification(reason: string, timeExceeded: string): void {
        this.sendNotification("⏰ Tempo de pausa excedido!", {
            body: `Motivo: ${reason}\nTempo excedido: ${timeExceeded}`,
            icon: "/favicon.png",
            tag: "break-exceeded",
            requireInteraction: true,
        });
    }

    sendBreakWarningNotification(reason: string, timeRemaining: string): void {
        this.sendNotification("⚠️ Pausa quase no limite", {
            body: `Motivo: ${reason}\nTempo restante: ${timeRemaining}`,
            icon: "/favicon.png",
            tag: "break-warning",
        });
    }

    clearNotificationCache(): void {
        this.sentNotifications.clear();
    }
}

const notificationManager = NotificationManager.getInstance();

export function useCentralNotifications() {
    const store = useCentralNotificationStore();
    const config = useNotificationsConfig();
    const { supervisors } = useFirebaseSupervisors();

    // Cache dos últimas mensagens processadas para evitar duplicatas
    const processedMessagesRef = useRef(new Set<string>());
    const pauseListenerRef = useRef<(() => void) | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Controla visibilidade da página
    const visibilityRef = useRef({
        isVisible:
            typeof document !== "undefined"
                ? document.visibilityState === "visible"
                : true,
        isFocused: typeof document !== "undefined" ? document.hasFocus() : true,
    });

    // Inicializa AudioContext
    useEffect(() => {
        if (typeof window !== "undefined" && !audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext ||
                    (window as any).webkitAudioContext)();
            } catch (error) {
                console.warn("AudioContext não suportado:", error);
            }
        }
    }, []);

    useEffect(() => {
        const onVisibilityChange = () => {
            const isVisible = document.visibilityState === "visible";
            visibilityRef.current.isVisible = isVisible;
            store.setPageVisibility(isVisible, visibilityRef.current.isFocused);
        };

        const onFocus = () => {
            visibilityRef.current.isFocused = true;
            store.setPageVisibility(visibilityRef.current.isVisible, true);
        };

        const onBlur = () => {
            visibilityRef.current.isFocused = false;
            store.setPageVisibility(visibilityRef.current.isVisible, false);
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("focus", onFocus);
        window.addEventListener("blur", onBlur);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                onVisibilityChange
            );
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("blur", onBlur);
        };
    }, [store]);

    // Função principal para adicionar notificação
    const notify = useCallback(
        async (
            notification: Omit<CentralNotification, "id" | "timestamp">
        ): Promise<string | undefined> => {
            // Verifica se o tipo de notificação está habilitado
            const isTypeEnabled = (() => {
                switch (notification.type) {
                    case "message":
                        return config.messageNotifications;
                    case "pause":
                        return config.pauseNotifications;
                    case "system":
                        return config.systemNotifications;
                    default:
                        return true;
                }
            })();

            if (!isTypeEnabled) {
                console.log(
                    `Notificação do tipo ${notification.type} está desabilitada nas preferências`
                );
                return undefined;
            }

            // Adiciona ao store
            const id = store.addNotification(notification);

            const isPageVisible = store.isVisible && store.isFocused;

            // Sempre tenta enviar PWA notification se não estiver na página ativa
            if (!isPageVisible) {
                try {
                    if (!notificationManager.canSendNotifications()) {
                        await notificationManager.requestPermission();
                    }

                    if (notificationManager.canSendNotifications()) {
                        notificationManager.sendMessageNotification(
                            notification.title,
                            notification.message || "",
                            notification.senderName || "Sistema",
                            notification.data?.supervisorId
                        );
                    }
                } catch (error) {
                    console.warn("Erro ao enviar PWA notification:", error);
                }
            }

            return id;
        },
        [config, store]
    );

    const supervisorNameById = useMemo(() => {
        const m = new Map<string, string>();
        supervisors.forEach((s) => m.set(s.id, s.name ?? s.id));
        return m;
    }, [supervisors]);

    // Funções específicas para cada tipo
    const notifyMessage = useCallback(
        async (
            title: string,
            message?: string,
            senderName?: string,
            data?: Record<string, any>
        ): Promise<string | undefined> => {
            // Se há um messageId nos dados, verifica se já foi visualizada ou previsualizada
            if (data?.messageId) {
                if (
                    store.isMessageViewed(data.messageId) ||
                    store.isMessagePreviewed(data.messageId)
                ) {
                    console.log(
                        "Mensagem já visualizada/previsualizada, pulando notificação:",
                        data.messageId
                    );
                    return undefined;
                }
            }

            // Toca som de notificação para mensagem usando configuração do usuário
            const soundType = config.config.soundType || "message";
            const soundVol = config.config.volume;

            console.log(
                "[centralNotificationsStore] -> [notifyMessage] --> config",
                config
            );
            console.log(
                "[centralNotificationsStore] -> [notifyMessage] --> soundType",
                soundType
            );
            playAlert(soundType as AlertType, {
                volume: soundVol,
            });

            return notify({
                type: "message",
                title,
                message,
                senderName,
                icon: "message",
                data,
            });
        },
        [notify, store]
    );

    const notifyPause = useCallback(
        async (
            title: string,
            message?: string,
            data?: Record<string, any>
        ): Promise<string | undefined> => {
            return notify({
                type: "pause",
                title,
                message,
                icon: "pause",
                variant: "warning",
                data,
            });
        },
        [notify]
    );

    const notifySystem = useCallback(
        async (
            title: string,
            message?: string,
            variant?: "info" | "success" | "error" | "warning",
            data?: Record<string, any>
        ): Promise<string | undefined> => {
            return notify({
                type: "system",
                title,
                message,
                variant: variant || "info",
                icon:
                    variant === "error"
                        ? "cancel"
                        : variant === "success"
                        ? "check"
                        : "alert",
                data,
            });
        },
        [notify]
    );

    // Listener para mensagens de chat
    const notifyIncoming = useCallback(
        (supervisor: SupervisorOnline, message: ChatMessage) => {
            const user = useAuthStore.getState().user;
            const store = useCentralNotificationStore.getState();

            if (!user || !message.id) return;

            // Evita processar a mesma mensagem duas vezes
            if (processedMessagesRef.current.has(message.id)) return;

            // Verifica se a mensagem já foi visualizada
            if (store.isMessageViewed(message.id)) return;

            processedMessagesRef.current.add(message.id);

            // Limpa cache de mensagens antigas (mantém apenas as últimas 50)
            if (processedMessagesRef.current.size > 50) {
                const entries = Array.from(processedMessagesRef.current);
                const toKeep = entries.slice(-25); // mantém as últimas 25
                processedMessagesRef.current = new Set(toKeep);
            }

            const senderName =
                supervisorNameById.get(supervisor.id) ??
                supervisor.name ??
                "Supervisor";
            const msgText = message.content?.trim() || "Nova mensagem";

            notifyMessage(
                `Mensagem de ${senderName}`,
                msgText.length > 120 ? msgText.slice(0, 120) + "…" : msgText,
                senderName,
                {
                    messageId: message.id,
                    supervisorId: supervisor.id,
                    createdAt: message.createdAt,
                }
            );
        },
        [supervisorNameById, notifyMessage]
    );

    // Listener para respostas de solicitação de pausa
    useEffect(() => {
        const user = useAuthStore.getState().user;
        const accountcode = useAppStore.getState().company?.accountcode;
        if (!user?.login || !accountcode) return;

        // Remove listener anterior se existir
        if (pauseListenerRef.current) {
            pauseListenerRef.current();
            pauseListenerRef.current = null;
        }

        // Cache para evitar processamento duplicado de respostas de pausa
        const processedPauseResponses = new Set<string>();

        const unsubscribe = listenPauseRequestStatus(
            accountcode,
            user.login,
            (data: PauseRequestPayload | null) => {
                if (!data) return;

                // Gera chave única para a resposta de pausa
                const responseKey = `${data.status}-${data.reasonId}-${data.startedAt}-${data.reasonName}`;

                // Evita processar a mesma resposta múltiplas vezes
                if (processedPauseResponses.has(responseKey)) {
                    console.log(
                        "centralNotificationsStore: Resposta já processada, ignorando:",
                        responseKey
                    );
                    return;
                }

                processedPauseResponses.add(responseKey);
                console.log(
                    "centralNotificationsStore: Processando nova resposta:",
                    responseKey
                );

                // Usar store diretamente para evitar loop
                const store = useCentralNotificationStore.getState();

                if (data.status === "approved") {
                    console.log(
                        "centralNotificationsStore: Processando pausa aprovada"
                    );
                    // Toca som para pausa aprovada usando configuração do usuário
                    const soundType = config.soundType || "success";
                    playAlert(soundType as AlertType);

                    store.addNotification({
                        type: "system",
                        title: "Pausa aprovada! ✅",
                        message: `Sua solicitação de pausa foi aprovada: ${data.reasonName}`,
                        variant: "success",
                        icon: "check",
                    });
                } else if (data.status === "rejected") {
                    console.log(
                        "centralNotificationsStore: Processando pausa rejeitada"
                    );
                    // Toca som para pausa rejeitada usando configuração do usuário
                    const soundType = config.soundType || "error";
                    playAlert(soundType as AlertType);

                    const notifResult = store.addNotification({
                        type: "system",
                        title: "Pausa rejeitada ❌",
                        message:
                            data.rejectionReason ||
                            `Sua solicitação de pausa foi rejeitada: ${data.reasonName}`,
                        variant: "error",
                        icon: "cancel",
                    });
                    console.log(
                        "centralNotificationsStore: Notificação de rejeição adicionada:",
                        notifResult
                    );
                }
            }
        );

        pauseListenerRef.current = unsubscribe;

        return () => {
            if (pauseListenerRef.current) {
                pauseListenerRef.current();
                pauseListenerRef.current = null;
            }
        };
    }, []); // dependências resolvidas via getState()

    // Inicialização de PWA notifications
    useEffect(() => {
        const initPWA = async () => {
            const notificationRequested = localStorage.getItem(
                "notification-permission-requested"
            );
            if (notificationRequested) return;

            const granted = await notificationManager.requestPermission();
            localStorage.setItem("notification-permission-requested", "true");

            if (granted) {
                notifySystem(
                    "Notificações ativas",
                    "Você receberá alertas de mensagens e pausas",
                    "success"
                );
            } else {
                notifySystem(
                    "Notificações desabilitadas",
                    "Ative as notificações para receber alertas importantes",
                    "error"
                );
            }
        };

        const timer = setTimeout(initPWA, 2000);
        return () => clearTimeout(timer);
    }, [notifySystem]);

    return {
        // Estado
        notifications: store.notifications,
        isVisible: store.isVisible,
        isFocused: store.isFocused,

        // Ações gerais
        notify,
        removeNotification: store.removeNotification,
        clearAll: store.clearAll,

        // Ações específicas para mensagens visualizadas
        markMessageAsViewed: store.markMessageAsViewed,
        isMessageViewed: store.isMessageViewed,

        // Ações para previsualização
        markMessageAsPreviewed: store.markMessageAsPreviewed,
        isMessagePreviewed: store.isMessagePreviewed,

        // Ações específicas
        notifyMessage,
        notifyPause,
        notifySystem,

        // Listeners para integração
        notifyIncoming,

        // PWA Functions
        canSendNotifications: notificationManager.canSendNotifications(),
        requestPermission:
            notificationManager.requestPermission.bind(notificationManager),
        sendMessageNotification: (
            senderName: string,
            message: string,
            supervisorName?: string,
            supervisorId?: string
        ) =>
            notificationManager.sendMessageNotification(
                senderName,
                message,
                supervisorName,
                supervisorId
            ),
        sendBreakExceededNotification:
            notificationManager.sendBreakExceededNotification.bind(
                notificationManager
            ),
        sendBreakWarningNotification:
            notificationManager.sendBreakWarningNotification.bind(
                notificationManager
            ),

        // Configurações
        config,
    };
}

// Função de conveniência para notificações do sistema (exportada para compatibilidade)
export const systemNotify = (
    notification: Omit<CentralNotification, "id" | "timestamp">
): string | undefined => {
    const store = useCentralNotificationStore.getState();
    return store.addNotification(notification);
};
