type Agente = {
    dataevento: string;
    interface: string;
    location: string;
    membername: string;
    paused: string;
    queue: string;
};

export type QueueMemberStatusItem = {
    status: string;
    label: string;
    agentes: Agente[];
};

type Totalizador = {
    queue: string;
    media_tma: number;
    media_tme: number;
    recebidas_abandonadas_na_fila: number;
    recebidas_atendidas_na_fila: number;
};

export type QueueMapCombinado = {
    [queueId: string]: {
        totalizadores: Totalizador;
        queueMemberStatus: QueueMemberStatusItem[];
    };
};

export function combinarQueueStatusETotalizadores(queueMemberStatus: Record<string, QueueMemberStatusItem[]>, totalizadoresByQueue: Totalizador[], opts: { onlyFromStatus?: boolean; onlyWithAgents?: boolean } = {}): QueueMapCombinado {
    const { onlyFromStatus = false, onlyWithAgents = false } = opts

    const resultado: QueueMapCombinado = {}
    const totalizadorById = new Map<string, Totalizador>(
        totalizadoresByQueue.map(t => [String(t.queue), t])
    )

    // sempre percorre as filas do queueMemberStatus
    for (const [queueId, statusList] of Object.entries(queueMemberStatus)) {
        const t = totalizadorById.get(queueId)
        resultado[queueId] = {
            totalizadores: {
                queue: queueId,
                media_tma: Number(t?.media_tma ?? 0),
                media_tme: Number(t?.media_tme ?? 0),
                recebidas_abandonadas_na_fila: Number(t?.recebidas_abandonadas_na_fila ?? 0),
                recebidas_atendidas_na_fila: Number(t?.recebidas_atendidas_na_fila ?? 0),
            },
            queueMemberStatus: statusList ?? [],
        }
    }

    // só adiciona filas que existem SÓ nos totalizadores quando não for "apenas do status"
    if (!onlyFromStatus) {
        for (const t of totalizadoresByQueue) {
            const id = String(t.queue)
            if (!resultado[id] && !(id in queueMemberStatus)) {
                resultado[id] = {
                    totalizadores: {
                        queue: id,
                        media_tma: Number(t.media_tma ?? 0),
                        media_tme: Number(t.media_tme ?? 0),
                        recebidas_abandonadas_na_fila: Number(t.recebidas_abandonadas_na_fila ?? 0),
                        recebidas_atendidas_na_fila: Number(t.recebidas_atendidas_na_fila ?? 0),
                    },
                    queueMemberStatus: [],
                }
            }
        }
    }

    // opcional: filtra para ficar só quem tem agentes
    if (onlyWithAgents) {
        for (const [id, v] of Object.entries(resultado)) {
            const hasAgents = (v.queueMemberStatus ?? []).some(s => (s.agentes?.length ?? 0) > 0)
            if (!hasAgents) delete resultado[id]
        }
    }

    return resultado
}
