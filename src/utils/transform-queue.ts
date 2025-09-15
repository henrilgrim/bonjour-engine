type Agente = {
    dataevento: string
    interface: string
    location: string
    paused: string
    queue: string
    membername: string
}

type PayloadItem = {
    id: string // status no Asterisk
    data: Agente[]
}

type ResultadoAgrupado = {
    [queueId: string]: {
        status: string
        label: string
        agentes: Agente[]
    }[]
}

export type QueueStatusMap = {
    [queueId: string]: {
        status: string
        label: string
        agentes: {
            dataevento: string
            interface: string
            location: string
            membername: string
            paused: string
            queue: string
        }[]
    }[]
}

const STATUS_LABELS: Record<string, string> = {
    "0": "Dispositivo desconhecido",
    "1": "Disponível",
    "2": "Em uso",
    "3": "Ocupado",
    "4": "Dispositivo inválido",
    "5": "Indisponível",
    "6": "Tocando",
    "7": "Em uso e tocando",
    "8": "Em espera",
}

function filtrarFilas(dados: ResultadoAgrupado): ResultadoAgrupado {
    const filtrado: ResultadoAgrupado = {}

    for (const [queueId, statusList] of Object.entries(dados)) {
        const statusComAgente = statusList.map((s) => ({ ...s, agentes: s.agentes.filter(Boolean) })).filter((s) => s.agentes.length > 0)
        const totalAgentes = statusComAgente.reduce((acc, s) => acc + s.agentes.length, 0)
        if (totalAgentes > 0) { filtrado[queueId] = statusComAgente }
    }

    return filtrado
}

export function reorganizarEAgrouparQueueMemberStatus(payload: PayloadItem[]): ResultadoAgrupado {
    const resultado: ResultadoAgrupado = {}

    for (const grupo of payload) {
        const statusOriginal = grupo.id

        for (const agente of grupo.data) {
            const queueId = agente.queue

            if (!queueId) continue
            if (agente.membername.split(":").length < 2) continue
            if (!resultado[queueId]) { resultado[queueId] = [] }

            let status = statusOriginal
            let label = STATUS_LABELS[statusOriginal] ?? `Status ${statusOriginal}`
            if (status === "1" && agente.paused === "1") { status = "999"; label = "Pausado"; }

            let statusEntry = resultado[queueId].find((s) => s.status === status)
            if (!statusEntry) { statusEntry = { status, label, agentes: [] }; resultado[queueId].push(statusEntry); }

            statusEntry.agentes.push(agente)
        }
    }

    return filtrarFilas(resultado)
}
