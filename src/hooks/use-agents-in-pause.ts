import { useState, useEffect } from "react";
import { onValue } from "firebase/database";
import { rtdbRefs } from "@/lib/firebase/realtime";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { registerRealtimeListener } from "@/lib/firebase/realtime/listeners";

export function useAgentsInPause() {
    const [agentsInPause, setAgentsInPause] = useState(0);
    const [loading, setLoading] = useState(true);
    const user = useAuthStore((s) => s.user);
    const company = useAppStore((s) => s.company);

    useEffect(() => {
        if (!user || !company?.accountcode) {
            setLoading(false);
            return;
        }

        const agentsRef = rtdbRefs.onlines(company.accountcode);

        const unsubscribe = onValue(agentsRef, (snapshot) => {
            let pauseCount = 0;

            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const agentData = childSnapshot.val();
                    // Conta agentes que estão em pausa e não são o usuário atual
                    if (agentData?.status === "in_pause" && agentData?.id !== user.id) {
                        pauseCount++;
                    }
                });
            }

            setAgentsInPause(pauseCount);
            setLoading(false);
        });

        // Registra o listener para ser limpo no logout
        registerRealtimeListener(unsubscribe);

        return () => unsubscribe();
    }, [user, company?.accountcode]);

    return { agentsInPause, loading };
}