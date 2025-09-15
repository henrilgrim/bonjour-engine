import { useState, useEffect, useRef } from "react";
import {
    listenAllPauseRequests,
    type PauseRequest,
} from "@/lib/firebase/realtime/pause/request";
import { usePwaNotifications } from "./use-pwa-notifications";
import { useFirebaseAgentSelection } from "./use-firebase-agent-selection";

interface UsePauseNotificationsOptions {
    accountcode: string;
    enabled?: boolean;
}

const keyOf = (req: PauseRequest) =>
    `${req.agentLogin}-${
        typeof req.createdAt === "number"
            ? req.createdAt
            : (req as any)?.createdAt?.seconds ?? 0
    }`;

export function usePauseNotifications({
    accountcode,
    enabled = true,
}: UsePauseNotificationsOptions) {
    const [notifications, setNotifications] = useState<PauseRequest[]>([]);
    const previousKeysRef = useRef<Set<string>>(new Set());
    const { showNotification, isPageVisible } = usePwaNotifications();
    const { selectedAgents, hasSelection } = useFirebaseAgentSelection();

    useEffect(() => {
        if (!accountcode || !enabled) return;

        const unsubscribe = listenAllPauseRequests(accountcode, (list) => {
            const arr = Array.isArray(list) ? list : [];
            let pending = arr.filter((req) => req.status === "pending");

            // Filtrar apenas agentes selecionados se há seleção
            if (hasSelection && selectedAgents.length > 0) {
                const selectedLogins = new Set(
                    selectedAgents.map((agent) => agent.login)
                );
                pending = pending.filter((req) =>
                    selectedLogins.has(req.agentLogin)
                );
            }

            // Detectar novas notificações
            const currentKeys = new Set(pending.map(keyOf));
            const newKeys = Array.from(currentKeys).filter(
                (key) => !previousKeysRef.current.has(key)
            );

            // Disparar notificações para novas solicitações
            if (newKeys.length > 0) {
                const newRequests = pending.filter((req) =>
                    newKeys.includes(keyOf(req))
                );

                newRequests.forEach((req) => {
                    // Sempre mostrar notificação do navegador se a aba não estiver ativa
                    showNotification({
                        title: "Nova Solicitação de Pausa",
                        body: `${req.agentLogin} solicitou pausa: ${req.reasonName}`,
                        playSound: true,
                        actions: [
                            {
                                action: "view",
                                title: "Voltar para o App",
                                icon: "/favicon.png",
                            },
                            {
                                action: "approve",
                                title: "Aprovar",
                                icon: "/favicon.png",
                            },
                        ],
                        data: {
                            agentLogin: req.agentLogin,
                            accountcode,
                            requestId: keyOf(req),
                        },
                    });
                });
            }

            previousKeysRef.current = currentKeys;
            setNotifications(pending);
        });

        return () => unsubscribe();
    }, [accountcode, enabled, showNotification, hasSelection, selectedAgents]);

    return {
        notifications,
        count: notifications.length,
    };
}
