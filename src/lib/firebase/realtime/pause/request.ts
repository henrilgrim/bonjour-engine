import {
    set,
    onValue,
    remove,
    update,
    serverTimestamp,
} from "firebase/database";
import { rtdbRefs } from "@/lib/firebase/realtime";
import { ensureAnonymousSession } from "@/lib/firebase/authentication";
import { registerRealtimeListener } from "../listeners";

export interface PauseRequestPayload {
    accountcode: string;
    agentLogin: string;
    reasonId: string;
    reasonName: string;
    rejectionReason?: string;
    startedAt: number; // ms (ou troque p/ serverTimestamp se preferir)
    status?: "pending" | "approved" | "rejected";
    nameWhoResponded: string;
    idWhoResponded: string;
    maxDuration?: number; // tempo máximo em segundos
    agentName?: string; // nome do agente
}

type Callback = (data: PauseRequestPayload | null) => void;

/**
 * Envia/atualiza uma requisição de pausa para o caminho:
 * /pxtalk_call_center_module/{accountcode}/agent_panel/pauses/pause-requests/{agentLogin}
 */
export const sendPauseRequest = async (payload: PauseRequestPayload) => {
    await ensureAnonymousSession();
    const { agentLogin, accountcode, ...data } = payload;

    await set(rtdbRefs.pauseRequests(accountcode, agentLogin), {
        ...data,
        status: "pending",
        createdAt: serverTimestamp(),
    });
};

/** Remove completamente a requisição de pausa do agente */
export const removePauseRequest = async (
    accountcode: string,
    agentLogin: string
) => {
    await remove(rtdbRefs.pauseRequests(accountcode, agentLogin));
};

/** Atualiza o status (aprovado/rejeitado) e opcionalmente o motivo da rejeição */
export const respondPauseRequest = async (
    accountcode: string,
    agentLogin: string,
    params: { status: "approved" | "rejected"; rejectionReason?: string }
) => {
    const { status, rejectionReason } = params;
    await update(rtdbRefs.pauseRequests(accountcode, agentLogin), {
        status,
        rejectionReason: status === "rejected" ? rejectionReason ?? "" : null,
        respondedAt: serverTimestamp(),
    });
};

/**
 * Escuta a requisição de pausa de um agente específico.
 * Retorna a função para descadastrar o listener manualmente.
 */
export const listenPauseRequestStatus = (
    accountcode: string,
    agentLogin: string,
    callback: Callback
) => {
    const requestRef = rtdbRefs.pauseRequests(accountcode, agentLogin);
    const unsub = onValue(requestRef, (snapshot) => {
        const data = snapshot.val();
        callback(data ? { accountcode, agentLogin, ...data } : null);
    });

    registerRealtimeListener(unsub);

    return unsub;
};

/**
 * Escuta todas as solicitações de pausa da conta (para o painel do gestor).
 * Retorna a função para descadastrar o listener manualmente.
 */
export const listenAllPauseRequests = (
    accountcode: string,
    callback: (list: Record<string, PauseRequestPayload> | null) => void
) => {
    const refAll = rtdbRefs.pauses(accountcode);

    const unsub = onValue(refAll, (snap) => {
        const val = snap.val() as Record<string, any> | null;
        if (!val) return callback(null);

        const mapped: Record<string, PauseRequestPayload> = {};
        for (const agentLogin of Object.keys(val)) {
            mapped[agentLogin] = {
                accountcode,
                agentLogin,
                ...val[agentLogin],
            };
        }
        callback(mapped);
    });

    registerRealtimeListener(unsub);

    return unsub;
};
