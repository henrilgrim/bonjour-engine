import { useCallback, useEffect, useMemo, useState } from "react";
import {
    listenCompanyQueues,
    listenCompanyTotalizersQueues,
} from "@/lib/firebase/realtime/company/listener";
import { useQueuesStore } from "@/store/queuesStore";
import { useAuthStore } from "@/store/authStore";

import {
    QueueStatusMap,
    reorganizarEAgrouparQueueMemberStatus,
} from "@/utils/transform-queue";
import { transformarQueuesMonitoring } from "@/utils/transform-queue-monitoting";
import {
    combinarQueueStatusETotalizadores,
    QueueMapCombinado,
} from "@/utils/another";

import {
    formatDuration,
    parseMember,
    firstLast,
    initials,
    toTitleCase,
    STATUS_UI,
} from "@/utils/home";
import { listenAgents } from "@/lib/firebase/realtime/online";

type AgentView = {
    id: string;
    initials: string;
    fullName: string;
    displayName: string;
    login: string;
    ramal: string;
    color: string;
    status: string;
    duration: string;
    queueId: string;
    queueName: string;
    raw: any;

    queues: {
        queueId: string;
        queueName: string;
    }[];

    dataevento: string;

    // campos adicionais vindos do RTDB
    idAgentDb?: string;
    isLoggedInPanel?: boolean;
    realRamal?: string;
    reason?: string;
};

type Stats = {
    totalAgents: number;
    availableAgents: number;
    busyAgents: number;
    ringingAgents: number;
    waitingAgents: number;
    pausedAgents: number;
    unavailableAgents: number;
    totalQueueSize: number;
};

export function useRealtimeAgents() {
    const company = useAuthStore((s) => s.company);
    const user = useAuthStore((s) => s.user);

    const itemsQueues = useQueuesStore((s) => s.items);
    const loadingQueues = useQueuesStore((s) => s.loading);
    const errorQueues = useQueuesStore((s) => s.error);
    const fetchAllQueues = useQueuesStore((s) => s.fetchAll);

    const [queuesMonitoringCombined, setQueuesMonitoringCombined] =
        useState<QueueMapCombinado>({});
    const [queueMemberStatus, setQueueMemberStatus] = useState<QueueStatusMap>(
        {}
    );
    const [totalizadoresByQueue, setTotalizadoresByQueue] = useState<any[]>([]);
    const [agentOrder, setAgentOrder] = useState<string[]>([]);
    const [agentsOnline, setAgentsOnline] = useState<any[]>([]);

    // fetch inicial das filas se necessário
    useEffect(() => {
        const filasStore = itemsQueues || [];
        const shouldFetch =
            !loadingQueues &&
            !errorQueues &&
            (filasStore.length === 0 ||
                filasStore.some((f) => !f.id || !f.name));
        if (shouldFetch) fetchAllQueues(user?.token_service);
    }, [
        itemsQueues,
        loadingQueues,
        errorQueues,
        fetchAllQueues,
        user?.token_service,
    ]);

    // listeners RTDB
    useEffect(() => {
        if (!company?.accountcode) return;

        const off = listenCompanyQueues(
            company.accountcode,
            (queues) =>
                setQueueMemberStatus(
                    reorganizarEAgrouparQueueMemberStatus(queues)
                ),
            (err) => console.error("Erro listener queues:", err)
        );

        const off2 = listenCompanyTotalizersQueues(
            company.accountcode,
            (queues) => {
                const retorno = queues
                    .filter((q) => q.data.queue)
                    .map((q) => ({
                        queue: q.data.queue,
                        media_tma: parseFloat(String(q.data.media_tma || 0)),
                        media_tme: parseFloat(String(q.data.media_tme || 0)),
                        recebidas_abandonadas_na_fila: parseInt(
                            String(q.data.recebidas_abandonadas_na_fila || 0)
                        ),
                        recebidas_atendidas_na_fila: parseInt(
                            String(q.data.recebidas_atendidas_na_fila || 0)
                        ),
                    }));
                setTotalizadoresByQueue(retorno);
            },
            (err) => console.error("Erro listener totalizadores:", err)
        );

        const off3 = listenAgents(
            company.accountcode,
            (agents) => {
                setAgentsOnline(agents);
            },
            (err) => console.error("Erro listener agents:", err)
        );

        return () => {
            off();
            off2();
            off3();
        };
    }, [company?.accountcode, itemsQueues]);

    // combinar status + totalizadores
    useEffect(() => {
        setQueuesMonitoringCombined(
            combinarQueueStatusETotalizadores(
                queueMemberStatus,
                totalizadoresByQueue ?? [],
                { onlyFromStatus: true }
            )
        );
    }, [queueMemberStatus, totalizadoresByQueue]);

    // transformar para estrutura usada na UI e filtrar filas sem agentes ou inexistentes no DB
    const filasTransformadas = useMemo(() => {
        const transformed = transformarQueuesMonitoring(
            queuesMonitoringCombined,
            itemsQueues
        );
        return transformed.filter((fila) => {
            const existeNoDB = itemsQueues.some((item) => item.id === fila.id);
            const temAgentes = fila.totalAgents > 0;
            return existeNoDB && temAgentes;
        });
    }, [queuesMonitoringCombined, itemsQueues]);

    // índice de agentes online (por login)
    const agentsOnlineMap = useMemo(() => {
        const map = new Map<string, any>();
        for (const a of agentsOnline) {
            if (a?.data?.login) {
                map.set(String(a.data.login), a.data);
            }
        }
        return map;
    }, [agentsOnline]);

    // helper novo para id estável
    const stableAgentIdOf = (ag: { login: string; ramal: string }) =>
        `${ag.login || "?"}__${ag.ramal || "?"}`;

    const allAgents: AgentView[] = useMemo(() => {
        const arr: AgentView[] = [];

        for (const fila of filasTransformadas) {
            const queueName = fila.name;
            for (const { status, agentes } of fila.queueMemberStatus ?? []) {
                const cfg = STATUS_UI[status as keyof typeof STATUS_UI];
                if (!cfg) continue;

                for (const ag of agentes) {
                    const { login, nome } = parseMember(ag.membername);
                    const since = ag.dataevento
                        ? new Date(ag.dataevento)
                        : null;
                    const elapsed = since
                        ? formatDuration(Date.now() - since.getTime())
                        : "—";
                    const loc_int = ag.location || ag.interface || null;
                    const ramal =
                        loc_int && String(loc_int).startsWith("SIP/")
                            ? String(loc_int).slice(4)
                            : loc_int || "—";

                    const stableId = stableAgentIdOf({ login, ramal });
                    const onlineInfo = agentsOnlineMap.get(login);

                    arr.push({
                        id: stableId,
                        initials: initials(nome),
                        fullName: toTitleCase(nome),
                        displayName: firstLast(nome),
                        login,
                        ramal,
                        color: cfg.color,
                        status: cfg.label,
                        duration: elapsed,
                        queueId: fila.id,
                        queueName,
                        queues: [
                            {
                                queueId: fila.id,
                                queueName,
                            },
                        ],
                        raw: [ag],
                        dataevento: ag.dataevento,
                        // enriquecimento do RTDB
                        idAgentDb: onlineInfo?.id,
                        isLoggedInPanel: !!onlineInfo,
                        realRamal: onlineInfo?.extension,
                        reason: onlineInfo?.reasonName,
                    });
                }
            }
        }

        // merge duplicados
        const map = new Map<string, AgentView>();

        for (const ag of arr) {
            if (!map.has(ag.id)) {
                map.set(ag.id, ag);
            } else {
                const existing = map.get(ag.id)!;
                existing.queues?.push(...(ag.queues ?? []));
                (existing.raw as any[]).push(...(ag.raw as any[]));

                // manter os dados extras do RTDB
                if (ag.isLoggedInPanel) {
                    existing.isLoggedInPanel = ag.isLoggedInPanel;
                    existing.reason = ag.reason;
                }

                // status mais recente
                if (
                    ag.dataevento &&
                    (!existing.dataevento ||
                        ag.dataevento > existing.dataevento)
                ) {
                    existing.dataevento = ag.dataevento;
                    existing.status = ag.status;
                    existing.color = ag.color;
                    existing.duration = ag.duration;
                }
            }
        }

        return Array.from(map.values());
    }, [filasTransformadas, agentsOnlineMap]);

    // ordem estável (pin)
    useEffect(() => {
        if (allAgents.length === 0) {
            setAgentOrder([]);
            return;
        }

        const incomingIds = allAgents.map((a) => a.id);

        setAgentOrder((prev) => {
            if (!prev || prev.length === 0) return incomingIds;
            const keep = prev.filter((id) => incomingIds.includes(id));
            const additions = incomingIds.filter((id) => !prev.includes(id));
            return Array.from(new Set([...keep, ...additions]));
        });
    }, [allAgents]);

    // KPIs únicos por agente
    const stats: Stats = useMemo(() => {
        const totalAgents = allAgents.filter((a) => a.isLoggedInPanel).length;

        const availableAgents = allAgents.filter(
            (a) => a.isLoggedInPanel && a.status === "Disponível"
        ).length;

        const busyAgents = allAgents.filter(
            (a) => a.isLoggedInPanel && a.status === "Em atendimento"
        ).length;

        const pausedAgents = allAgents.filter(
            (a) => a.isLoggedInPanel && a.status === "Em pausa"
        ).length;

        const unavailableAgents = allAgents.filter(
            (a) => a.isLoggedInPanel && a.status === "Indisponível"
        ).length;

        const ringingAgents = allAgents.filter(
            (a) => a.isLoggedInPanel && a.status === "Tocando"
        ).length;

        const waitingAgents = allAgents.filter(
            (a) => a.isLoggedInPanel && a.status === "Aguardando"
        ).length;

        const totalQueueSize = filasTransformadas.reduce(
            (acc, f) => acc + (f.queueSize || 0),
            0
        );

        return {
            totalAgents,
            availableAgents,
            busyAgents,
            ringingAgents,
            waitingAgents,
            pausedAgents,
            unavailableAgents,
            totalQueueSize,
        };
    }, [allAgents, filasTransformadas]);

    // aplica ordenação estável
    const orderedAgents = useMemo(() => {
        const onlyLogged = allAgents.filter((a) => a.isLoggedInPanel);
        if (agentOrder.length === 0) return onlyLogged;
        const pos = new Map(agentOrder.map((id, i) => [id, i]));
        return [...onlyLogged].sort((a, b) => {
            const ia = pos.get(a.id);
            const ib = pos.get(b.id);
            if (ia === undefined && ib === undefined) return 0;
            if (ia === undefined) return 1;
            if (ib === undefined) return -1;
            return ia - ib;
        });
    }, [allAgents, agentOrder]);

    // refresh manual
    const refresh = useCallback(() => {
        if (user?.token_service) fetchAllQueues(user.token_service);
    }, [user?.token_service, fetchAllQueues]);

    return {
        orderedAgents,
        stats,
        loading: loadingQueues,
        error: errorQueues,
        refresh,
    };
}

export type { AgentView, Stats };
