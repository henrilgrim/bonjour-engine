import {
    set,
    serverTimestamp,
    onDisconnect,
    get,
    update,
    onValue,
} from "firebase/database";
import type { Agent } from "@/types/auth-store";
import {
    ensureAnonymousSession,
    ensureFirebaseReady,
} from "@/lib/firebase/authentication";
import { Company } from "@/types";
import { rtdbRefs } from "..";
import { registerRealtimeListener } from "../listeners";

export async function loginAgent({
    user,
    company,
}: {
    user: Agent;
    company: Company;
}) {
    await ensureAnonymousSession();
    const accountcode = company.accountcode;
    const agent_id = user.id;

    const agentRef = rtdbRefs.agentOnline(accountcode, agent_id);

    await set(agentRef, {
        id: user.id,
        name: user.name,
        extension: String(
            (user as any).extension ?? user.queues?.[0]?.id ?? ""
        ), // ajuste se necessário
        login: String(user.login),
        password: String(user.password),
        status: "logged", // "logged" | "offline" | "in_pause"
        queues: user.queues.map((q) => ({ id: q.id, priority: q.priority })),
        lastLoginAt: serverTimestamp(),
    });
}

export async function logoutAgent(agent_id: string, accountcode: string) {
    const u = await ensureFirebaseReady();
    if (!u) return;

    const agentRef = rtdbRefs.agentOnline(accountcode, agent_id);
    await set(agentRef, null);

    try {
        await onDisconnect(agentRef).cancel();
    } catch {}
}

export async function changeStatusAgent(
    agent_id: string,
    accountcode: string,
    status: "logged" | "in_pause" | "offline",
    reasonName?: string,
    maxDuration?: number,
    startedAt?: number
) {
    const u = await ensureFirebaseReady();
    if (!u) return;

    const agentRef = rtdbRefs.agentOnline(accountcode, agent_id);
    if (status === "in_pause") {
        await update(agentRef, {
            status,
            reasonName,
            maxDuration: maxDuration || null,
            pauseStartedAt: startedAt || serverTimestamp(),
            lastStatusChangeAt: serverTimestamp(),
        });
    } else {
        await update(agentRef, {
            status,
            lastStatusChangeAt: serverTimestamp(),
        });
    }
}

export async function countOnlineAgents(accountcode: string) {
    const u = await ensureFirebaseReady();
    if (!u) return 0;

    const agentsRef = rtdbRefs.onlines(accountcode);
    const snap = await get(agentsRef);

    let total = 0;
    if (snap.exists()) {
        snap.forEach((loginSnap) => {
            const val = loginSnap.val();
            if (val?.status === "logged") total++;
        });
    }
    return total;
}

/**
 * Escuta em tempo real todos os agentes online de uma empresa.
 * Retorna a função para descadastrar manualmente o listener.
 * Também é registrado globalmente para ser limpo no logout.
 */
export function listenOnlineAgents(
    accountcode: string,
    callback: (agents: any[]) => void
) {
    const agentsRef = rtdbRefs.onlines(accountcode);

    const unsub = onValue(agentsRef, (snap) => {
        const list: any[] = [];
        snap.forEach((child) => {
            list.push(child.val());
        });
        callback(list);
    });

    // ✅ registra globalmente para ser limpo no logout
    registerRealtimeListener(unsub);

    return unsub;
}
