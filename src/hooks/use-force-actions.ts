import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { useLogout } from "./use-logout";
import { listenForceActions, clearForceAction, ForceAction } from "@/lib/firebase/realtime/force";
import { useReasonStore } from "@/store/reasonStore";
import { systemNotify } from "@/lib/notifications";

export function useForceActions() {
    const user = useAuthStore((s) => s.user);
    const company = useAppStore((s) => s.company);
    const { logout } = useLogout();
    const { endPause, correlationPause } = useReasonStore();

    useEffect(() => {
        if (!user?.login || !company?.accountcode) return;

        const unsub = listenForceActions(
            company.accountcode,
            user.login,
            async (action: ForceAction | null) => {
                if (!action) return;

                try {
                    switch (action.action) {
                        case "queue_removal":
                            systemNotify({
                                title: "Logout forçado",
                                message: "Você foi desconectado pelo supervisor",
                                variant: "warning",
                                type: "system",
                                duration: 5000,
                            });
                            
                            // Aguarda um pouco para mostrar a notificação
                            setTimeout(async () => {
                                await logout();
                            }, 1000);
                            break;

                        case "pause_removal":
                            if (correlationPause?._id) {
                                systemNotify({
                                    title: "Pausa removida",
                                    message: "Sua pausa foi finalizada pelo supervisor",
                                    variant: "warning",
                                    type: "system",
                                    duration: 5000,
                                });

                                await endPause(correlationPause._id);
                            }
                            break;
                    }

                    // Remove a ação após processá-la
                    await clearForceAction(company.accountcode, user.login);
                } catch (error) {
                    console.error("Erro ao processar ação forçada:", error);
                }
            }
        );

        return unsub;
    }, [user?.login, company?.accountcode, logout, endPause, correlationPause]);
}