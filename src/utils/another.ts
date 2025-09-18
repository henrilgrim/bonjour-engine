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
