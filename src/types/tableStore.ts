export type CallTicket = {
    AgentRingNoAnswer: string | null
    AgentRingNoAnswer_qtd: number
    AgentsCalled_qtd: number
    TMA: number
    TME: number

    agente_ligou_login: string | null
    agente_ligou_nome: string | null
    agente_recebeu_login: string | null
    agente_recebeu_nome: string | null

    ano: number
    answertime: string
    aplicacao: string
    asterisk_id: string
    audiorecord: string | null
    banco_id: string
    callid: string | null

    chamada_duracao_conversa: number
    chamada_duracao_total: number
    chamada_inicio: string
    chamada_inicio_br: string
    chamada_status: string
    chamada_tipo: string | null

    channel: string
    conta: string
    correlation_call_id: string | null
    createdAt: string
    data: string

    destino: string
    destino_grupo_id: string | null
    destino_grupo_tipo: string
    dia_da_semana: string
    did_bilhete: string | null

    endtime: string
    externalId: string

    fila_chamada_posicao_final: number | null
    fila_chamada_posicao_inicial: number | null
    fila_chamada_status: string | null
    fila_chamada_tempo_de_espera: number | null
    fila_id: string | null
    fila_nome: string | null

    horas: number
    horas2: string

    id_agente_ligou: string | null
    id_agente_recebeu: string | null
    id_empresa: number
    linkedid: string
    member: string | null
    mes: number

    nome_destino: string | null
    nome_origem: string | null
    origem: string
    origem_grupo_id: string | null
    origem_grupo_tipo: string

    px_app: string | null
    px_form: string | null
    px_label: string | null

    real_audiorecord: string | null
    real_videoLink: string | null

    segware_code: string | null
    segware_codigo: string | null
    segware_contactid: string | null
    segware_eventid: string | null
    segware_phone: string | null
    segware_resposta_code: string | null

    sequence: number
    servidor: string
    sigame: string | null
    status: string

    supervisor_id_agente_ligou: string | null
    supervisor_id_agente_recebeu: string | null
    supervisor_name_agente_ligou: string | null
    supervisor_name_agente_recebeu: string | null

    tipo_destino: string
    tipo_origem: string
    transbordo: boolean

    updatedAt: string
    userfield: string | null
    videoLink: string | null
    videoid: string | null
}

export type CallTicketWithMedia = CallTicket & {
    real_audiorecord: string | null
    real_videoLink: string | null
}

export type AudioMap = {
    id: string
    audiorecord: string | null
    videoLink: string | null
}