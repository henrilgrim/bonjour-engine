import { get, onValue } from "firebase/database";
import { rtdbRefs } from "..";
import { registerRealtimeListener } from "../listeners";

export interface SupervisorOnline {
    id: string;
    lastLoginAt: number;
    name: string;
    status: "logged" | "offline" | string;
    unreadCount?: number;
}

/** Consulta única (sem listener) */
export async function getSupervisorsOnline(accountcode: string) {
    const ref = rtdbRefs.supervisorsOnline(accountcode);
    const snap = await get(ref);
    return snap.exists()
        ? (snap.val() as Record<string, SupervisorOnline>)
        : null;
}

/** Escuta supervisores online em tempo real */
export function listenSupervisorsOnline(
    accountcode: string,
    callback: (list: SupervisorOnline[] | null) => void,
    onError?: (err: unknown) => void
) {
    const ref = rtdbRefs.supervisorsOnline(accountcode);
    const unsub = onValue(
        ref,
        (snap) => {
            if (!snap.exists()) {
                callback(null);
                return;
            }
            const data = snap.val() as Record<string, SupervisorOnline>;
            callback(Object.values(data));
        },
        (err) => {
            console.error("Erro ao escutar supervisores:", err);
            onError?.(err);
        }
    );

    registerRealtimeListener(unsub);

    return unsub;
}
