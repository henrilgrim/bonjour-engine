import { onValue, set } from "firebase/database";
import { rtdbRefs } from "..";
import { registerRealtimeListener } from "../listeners";

export type ForceAction = {
    agentLogin: string;
    agentId: string;
    registernumber: string;
    action: "queue_removal" | "pause_removal";
    timestamp: number;
};

/**
 * Escuta ações forçadas para um agente específico
 */
export function listenForceActions(
    accountcode: string,
    agentLogin: string,
    callback: (action: ForceAction | null) => void
): () => void {
    const forceRef = rtdbRefs.forceAction(accountcode, agentLogin);

    const unsub = onValue(forceRef, (snapshot) => {
        const data = snapshot.val();
        callback(data);
    });

    // Registra globalmente para ser limpo no logout
    registerRealtimeListener(unsub);

    return unsub;
}

/**
 * Remove uma ação forçada após ser processada
 */
export async function clearForceAction(
    accountcode: string,
    agentLogin: string
): Promise<void> {
    const forceRef = rtdbRefs.forceAction(accountcode, agentLogin);
    await set(forceRef, null);
}