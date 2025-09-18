import { useCallback, useEffect, useRef, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { useNotificationsConfig } from "@/hooks/use-notifications-config";
import {
    useFirebaseSupervisors,
    type SupervisorOnline,
} from "@/hooks/use-firebase-supervisors";
import {
    listenPauseRequestStatus,
    type PauseRequestPayload,
} from "@/lib/firebase/realtime/pause/request";
import type { ChatMessage } from "@/lib/firebase/firestore/chats/types";

import { useNotificationStore } from "./store";
import { notificationManager } from "./manager";
import type { CentralNotification } from "./types";

export function useNotifications() {
    const store = useNotificationStore();
    const { config, playNotificationSound, isEnabled } =
        useNotificationsConfig();
    const { supervisors } = useFirebaseSupervisors();

    // Refs para controle de listeners e cache
    const processedMessagesRef = useRef(new Set<string>());
    const pauseListenerRef = useRef<(() => void) | null>(null);
    const processedPauseResponsesRef = useRef(new Set<string>());

    // Controla visibilidade da página
    const visibilityRef = useRef({
        isVisible:
            typeof document !== "undefined"
                ? document.visibilityState === "visible"
                : true,
        isFocused: typeof document !== "undefined" ? document.hasFocus() : true,
    });

    // Monitora visibilidade da página
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
            const typeEnabled = isEnabled(notification.type);
            if (!typeEnabled) {
                return undefined;
            }

            // Adiciona ao store interno
            const id = store.addNotification(notification);

            // Toca som baseado na configuração
            const soundType =
                notification.type === "system"
                    ? notification.variant === "error"
                        ? "rejected"
                        : notification.variant === "success"
                        ? "approved"
                        : "system"
                    : notification.type;

            playNotificationSound(soundType as any);

            // Envia PWA notification apenas para pausas/sistema, não para chat
            const isPageActive = store.isVisible && store.isFocused;
            if (!isPageActive && notification.type !== "message") {
                try {
                    if (!notificationManager.canSendNotifications()) {
                        await notificationManager.requestPermission();
                    }

                    if (notificationManager.canSendNotifications()) {
                        notificationManager.sendSystemNotification(
                            notification.title,
                            notification.message
                        );
                    }
                } catch (error) {
                    console.warn("Erro ao enviar PWA notification:", error);
                }
            }

            return id;
        },
        [store, isEnabled, playNotificationSound]
    );

    const supervisorNameById = useMemo(() => {
        const map = new Map<string, string>();
        supervisors.forEach((s) => map.set(s.id, s.name ?? s.id));
        return map;
    }, [supervisors]);

    // Notificação de mensagem
    const notifyMessage = useCallback(
        async (
            title: string,
            message?: string,
            senderName?: string,
            data?: Record<string, any>
        ): Promise<string | undefined> => {
            // Verifica se mensagem já foi visualizada
            if (data?.messageId) {
                if (
                    store.isMessageViewed(data.messageId) ||
                    store.isMessagePreviewed(data.messageId)
                ) {
                    return undefined;
                }
            }

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

    // Notificação de pausa
    const notifyPause = useCallback(
        async (
            title: string,
            message?: string,
            variant?: "warning" | "error" | "success",
            data?: Record<string, any>
        ): Promise<string | undefined> => {
            // Adiciona à store de notificações in-app
            const result = notify({
                type: "pause",
                title,
                message,
                variant: variant || "warning",
                icon:
                    variant === "error"
                        ? "cancel"
                        : variant === "success"
                        ? "check"
                        : "pause",
                data,
            });

            // Também mostra via toast para garantir visibilidade
            try {
                const { toast } = await import("sonner");
                const toastVariant =
                    variant === "error"
                        ? "error"
                        : variant === "success"
                        ? "success"
                        : "warning";

                if (toastVariant === "error") {
                    toast.error(title, { description: message });
                } else if (toastVariant === "success") {
                    toast.success(title, { description: message });
                } else {
                    toast.warning(title, { description: message });
                }
            } catch (error) {
                console.error("❌ Erro ao exibir toast:", error);
            }

            return result;
        },
        [notify]
    );

    // Notificação de sistema
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
            if (!user || !message.id) return;

            // Evita processar a mesma mensagem duas vezes
            if (processedMessagesRef.current.has(message.id)) return;

            // Verifica se a mensagem já foi visualizada
            if (store.isMessageViewed(message.id)) return;

            processedMessagesRef.current.add(message.id);

            // Limpa cache de mensagens antigas
            if (processedMessagesRef.current.size > 50) {
                const entries = Array.from(processedMessagesRef.current);
                const toKeep = entries.slice(-25);
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
        [supervisorNameById, notifyMessage, store]
    );

    // Listener centralizado para respostas de pausa
    useEffect(() => {
        const user = useAuthStore.getState().user;
        const company = useAppStore.getState().company;

        if (!user?.login || !company?.accountcode) {
            return;
        }

        // Remove listener anterior se existir
        if (pauseListenerRef.current) {
            pauseListenerRef.current();
            pauseListenerRef.current = null;
        }

        const unsubscribe = listenPauseRequestStatus(
            company.accountcode,
            user.login,
            (data: PauseRequestPayload | null) => {
                if (!data) {
                    return;
                }

                // Gera chave única para evitar duplicatas
                const responseKey = `${data.status}-${data.reasonId}-${data.startedAt}`;

                if (processedPauseResponsesRef.current.has(responseKey)) {
                    return;
                }

                processedPauseResponsesRef.current.add(responseKey);

                // Centraliza toda a lógica de notificação de pausa aqui
                if (data.status === "approved") {
                    // Som + notificação in-app + PWA
                    notificationManager.playNotificationSound(
                        "approved",
                        config
                    );
                    notificationManager.sendPauseNotification(
                        "approved",
                        data.reasonName
                    );

                    notifyPause(
                        "Pausa aprovada! ✅",
                        `Sua solicitação foi aprovada: ${data.reasonName}`,
                        "success"
                    );
                } else if (data.status === "rejected") {
                    // Som + notificação in-app + PWA
                    notificationManager.playNotificationSound(
                        "rejected",
                        config
                    );
                    notificationManager.sendPauseNotification(
                        "rejected",
                        data.reasonName,
                        data.rejectionReason
                    );

                    const rejectionMessage =
                        data.rejectionReason ||
                        `Sua solicitação foi rejeitada: ${data.reasonName}`;

                    notifyPause(
                        "Pausa rejeitada ❌",
                        rejectionMessage,
                        "error"
                    );
                } else {
                }

                // Limpa cache antigo
                if (processedPauseResponsesRef.current.size > 20) {
                    const entries = Array.from(
                        processedPauseResponsesRef.current
                    );
                    processedPauseResponsesRef.current = new Set(
                        entries.slice(-10)
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
    }, [config, notifyPause]);

    // Funções específicas para pausas (para compatibilidade)
    const sendBreakExceededNotification = useCallback(
        (reasonName: string, timeExceeded: string) => {
            // Chave única baseada apenas no tipo e razão para evitar duplicatas
            const notificationKey = `exceeded-${reasonName}`;

            if (notificationManager.isDuplicate(notificationKey)) {
                return;
            }
            notificationManager.markAsSent(notificationKey);

            notificationManager.playNotificationSound("breakExceeded", config);

            // Só envia PWA se usuário não estiver na aba
            if (!store.isVisible || !store.isFocused) {
                notificationManager.sendPauseNotification(
                    "exceeded",
                    reasonName,
                    timeExceeded
                );
            }

            notifyPause(
                "⏰ Tempo de pausa excedido!",
                `Motivo: ${reasonName}\nTempo excedido: ${timeExceeded}`,
                "error"
            );
        },
        [config, notifyPause, store.isVisible, store.isFocused]
    );

    const sendBreakWarningNotification = useCallback(
        (reasonName: string, timeRemaining: string) => {
            // Chave única baseada apenas no tipo e razão para evitar duplicatas
            const notificationKey = `warning-${reasonName}`;

            if (notificationManager.isDuplicate(notificationKey)) {
                return;
            }
            notificationManager.markAsSent(notificationKey);

            notificationManager.playNotificationSound("warning", config);

            // Só envia PWA se usuário não estiver na aba
            if (!store.isVisible || !store.isFocused) {
                notificationManager.sendPauseNotification(
                    "warning",
                    reasonName,
                    timeRemaining
                );
            }

            notifyPause(
                "⚠️ Pausa quase no limite",
                `Motivo: ${reasonName}\nTempo restante: ${timeRemaining}`,
                "warning"
            );
        },
        [config, notifyPause, store.isVisible, store.isFocused]
    );

    // Inicialização de permissões
    useEffect(() => {
        const initPermissions = async () => {
            const permissionRequested = localStorage.getItem(
                "notification-permission-requested"
            );
            if (permissionRequested) return;

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

        const timer = setTimeout(initPermissions, 2000);
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

        // Ações específicas
        notifyMessage,
        notifyPause,
        notifySystem,

        // Ações para mensagens
        markMessageAsViewed: store.markMessageAsViewed,
        isMessageViewed: store.isMessageViewed,
        markMessageAsPreviewed: store.markMessageAsPreviewed,
        isMessagePreviewed: store.isMessagePreviewed,

        // Listener para chat
        notifyIncoming,

        // Funções específicas de pausa (compatibilidade)
        sendBreakExceededNotification,
        sendBreakWarningNotification,

        // PWA Functions
        canSendNotifications: notificationManager.canSendNotifications(),
        requestPermission: () => notificationManager.requestPermission(),
    };
}

// Hook simplificado para casos básicos
export function useSimpleNotifications() {
    const { notify, notifySystem, notifyMessage, notifyPause } =
        useNotifications();
    return { notify, notifySystem, notifyMessage, notifyPause };
}
