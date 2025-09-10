import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import type { ChatMessage } from "@/lib/firebase/firestore/chats/types";
import { subscribeToAllMessagesForAgent_byEnumeratingChats } from "@/lib/firebase/firestore/chats";
import { useFirebaseSupervisors } from "./use-firebase-supervisors";

type UnreadBySupervisor = {
    supervisorId: string;
    count: number;
};

export function useTotalUnreadCount() {
    const [totalUnread, setTotalUnread] = useState(0);
    const [unreadBySupervisor, setUnreadBySupervisor] = useState<
        UnreadBySupervisor[]
    >([]);

    const agentLogin = useAuthStore((s) => s.user?.login);
    const accountcode = useAppStore((s) => s.company?.accountcode);
    const { supervisors } = useFirebaseSupervisors(); // opcional: usado só p/ ordenar/validar ids

    useEffect(() => {
        if (!agentLogin || !accountcode) {
            setTotalUnread(0);
            setUnreadBySupervisor([]);
            return;
        }

        const unsubPromise = subscribeToAllMessagesForAgent_byEnumeratingChats(
            accountcode,
            agentLogin,
            (allMsgs: ChatMessage[]) => {
                let filtered = [...allMsgs];
                filtered = filtered.filter((m) => !m.read);
                const counts = new Map<string, number>();

                for (const m of filtered) {
                    if (m.role !== "supervisor") continue;

                    const supId = m.senderId;

                    if (!supId) continue;
                    counts.set(supId, (counts.get(supId) ?? 0) + 1);
                }

                const total = Array.from(counts.values()).reduce(
                    (acc, n) => acc + n,
                    0
                );
                setTotalUnread(total);

                const list: UnreadBySupervisor[] = Array.from(counts.entries())
                    .map(([supervisorId, count]) => ({ supervisorId, count }))
                    .filter((x) => x.count > 0)
                    .sort((a, b) => b.count - a.count);

                setUnreadBySupervisor(list);
            },
            (err) => {
                console.error("useTotalUnreadCount subscribe error:", err);
                setTotalUnread(0);
                setUnreadBySupervisor([]);
            }
        );

        return () => {
            (async () => {
                try {
                    const unsub = await unsubPromise;
                    unsub?.();
                } catch {}
            })();
        };
    }, [agentLogin, accountcode]);

    return { totalUnread, unreadBySupervisor };
}
