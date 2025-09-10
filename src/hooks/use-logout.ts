import { useState, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { logoutFirebase } from "@/lib/firebase/authentication";
import { useAppStore } from "@/store/appStore";
import { useReasonStore } from "@/store/reasonStore";
import { useTableStore } from "@/store/tableStore";
import { useSupervisorStore } from "@/store/supervisorStore";
import { useCoreStore } from "@/store/coreStore";
import { useCentralNotificationStore } from "@/store/centralNotificationsStore";
import { logoutAgent } from "@/lib/firebase/realtime/online";

export function useLogout() {
    const [isLoading, setIsLoading] = useState(false);
    const authStoreSignOut = useAuthStore((s) => s.signOut);
    const userId = useAuthStore((s) => s.user?.id);
    const accountcode = useAppStore((s) => s.company?.accountcode);
    const authStoreClear = useAuthStore((s) => s.clear);
    const appStoreClear = useAppStore((s) => s.clear);
    const reasonStoreClear = useReasonStore((s) => s.clear);
    const tableStoreClear = useTableStore((s) => s.clear);
    const tableStoreSetActive = useTableStore((s) => s.setActive);
    const supervisorStoreClear = useSupervisorStore((s) => s.clear);
    const coreStoreClear = useCoreStore((s) => s.clear);
    const centralNotificationStoreClear = useCentralNotificationStore(
        (s) => s.clear
    );

    const setListening = useSupervisorStore((s) => s.setListening);

    const logout = useCallback(
        async (opts?: { keepAnonymous?: boolean }) => {
            setIsLoading(true);

            try {
                tableStoreSetActive(false);
                setListening(false);
                await authStoreSignOut();
                await logoutAgent(userId, accountcode);

                appStoreClear();
                authStoreClear();
                reasonStoreClear();
                tableStoreClear();
                supervisorStoreClear();
                coreStoreClear();
                centralNotificationStoreClear();

                await logoutFirebase({ keepAnonymous: false, ...opts });
            } catch (error) {
                tableStoreSetActive(false);
                setListening(false);
                await authStoreSignOut();

                appStoreClear();
                authStoreClear();
                reasonStoreClear();
                tableStoreClear();
                supervisorStoreClear();
                coreStoreClear();
                centralNotificationStoreClear();

                console.error("Logout error:", error);
                try {
                    await logoutFirebase({ keepAnonymous: false, ...opts });
                } catch {}
            } finally {
                setIsLoading(false);
            }
        },
        [
            authStoreSignOut,
            appStoreClear,
            reasonStoreClear,
            tableStoreClear,
            tableStoreSetActive,
            authStoreClear,
        ]
    );

    return {
        logout,
        isLoading,
    };
}
