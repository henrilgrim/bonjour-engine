import { useEffect, useRef } from "react";
import { useSupervisorStore } from "@/store/supervisorStore";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { listenSupervisorsOnline } from "@/lib/firebase/realtime/supervisors";

export interface SupervisorOnline {
    id: string;
    lastLoginAt: number;
    name: string;
    status: "logged" | "offline" | string;
    unreadCount?: number;
}

export function useFirebaseSupervisors() {
    const {
        setSupervisor,
        markSupervisorOffline,
        updateLastSeen,
        setListening,
        getSupervisorsList,
    } = useSupervisorStore();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const accountcode = useAppStore((s) => s.company.accountcode);

    const supervisors = getSupervisorsList();
    const loading = useRef(false);
    const error = useRef<unknown>(null);

    useEffect(() => {
        if (!accountcode || !isAuthenticated) {
            setListening(false);
            loading.current = false;
            error.current = null;
            return;
        }

        loading.current = true;
        error.current = null;
        setListening(true);

        const now = Date.now();
        const unsubscribe = listenSupervisorsOnline(
            accountcode,
            (supervisorsList) => {
                if (!useAuthStore.getState().isAuthenticated) {
                    loading.current = false;
                    return;
                }

                loading.current = false;

                if (supervisorsList && supervisorsList.length > 0) {
                    supervisorsList.forEach((supervisor) => {
                        setSupervisor(supervisor);
                        updateLastSeen(supervisor.id, now);
                    });

                    // Marca offline quem saiu da lista
                    const currentIds = new Set(
                        supervisorsList.map((s) => s.id)
                    );
                    const storeIds = new Set(
                        getSupervisorsList().map((s) => s.id)
                    );

                    storeIds.forEach((id) => {
                        if (!currentIds.has(id)) {
                            markSupervisorOffline(id);
                        }
                    });
                } else {
                    // Nenhum supervisor → marca todos offline
                    const all = getSupervisorsList();
                    all.forEach((s) => markSupervisorOffline(s.id));
                }
            },
            (err) => {
                if (useAuthStore.getState().isAuthenticated) {
                    console.error("Erro ao escutar supervisores:", err);
                }
                error.current = err;
                loading.current = false;
                setListening(false);
            }
        );

        return () => {
            try {
                unsubscribe();
            } catch {}
            setListening(false);
        };
    }, [
        accountcode,
        isAuthenticated,
        setSupervisor,
        markSupervisorOffline,
        updateLastSeen,
        setListening,
        getSupervisorsList,
    ]);

    return {
        supervisors,
        loading: loading.current,
        error: error.current,
    };
}
