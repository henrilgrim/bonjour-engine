import { QueueItem } from "@/store/queuesStore";
import { QueueMapCombinado } from "./another";
import { AGENT_STATUS } from '@/lib/constants'
const { DISPONIVEL, EM_USO, OCUPADO, INDISPONIVEL, TOCANDO, EM_USO_TOCANDO, EM_ESPERA, EM_PAUSA } = AGENT_STATUS;

type Agent = {
    dataevento: string;
    interface?: string;
    location: string;
    membername: string;
    paused: string;
    queue: string;
}

export type TransformedQueue = {
    id: string;
    name: string;
    totalAgents: number;
    availableAgents: number;
    busyAgents: number;
    pausedAgents: number;
    queueSize: number;

    queueMemberStatus: {
        status: string;
        label: string;
        agentes: Agent[];
    }[];

    totalizadores?: {
        mediaTMA: number;
        mediaTME: number;
        recebidasAbandonadas: number;
        recebidasAtendidas: number;
    };

    configuracao?: any;
}

export function transformarQueuesMonitoring(combined: QueueMapCombinado, filas: QueueItem[]): TransformedQueue[] {
    const filaMap = new Map(filas.map(f => [f.id, f]))

    return Object.entries(combined).map(([queueId, data]) => {
        const { queueMemberStatus, totalizadores } = data

        let available = 0
        let busy = 0
        let paused = 0
        let unavailable = 0

        queueMemberStatus.forEach(({ status, agentes }) => {
            switch (status) {
                case DISPONIVEL:
                    available += agentes.length
                    break
                case EM_USO:
                case OCUPADO:
                case TOCANDO:
                case EM_USO_TOCANDO:
                case EM_ESPERA:
                    busy += agentes.length
                    break
                case EM_PAUSA:
                    paused += agentes.length
                    break
                case INDISPONIVEL:
                    unavailable += agentes.length
                    break
                default:
                    break
            }
        })

        const total = available + busy + paused + unavailable
        const fila = filaMap.get(queueId)

        return {
            id: queueId,
            name: fila?.name || queueId,
            totalAgents: total,
            availableAgents: available,
            busyAgents: busy,
            pausedAgents: paused,
            unavailableAgents: unavailable,
            queueSize: 0,

            queueMemberStatus: queueMemberStatus,

            totalizadores: totalizadores ? {
                mediaTMA: totalizadores.media_tma,
                mediaTME: totalizadores.media_tme,
                recebidasAbandonadas: totalizadores.recebidas_abandonadas_na_fila,
                recebidasAtendidas: totalizadores.recebidas_atendidas_na_fila,
            } : undefined,
        }
    })
}
