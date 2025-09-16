export type WebhookMethod = "GET" | "POST"

export type PxAlertConfig = {
    id?: string
    accountcode: string

    // Som
    soundEnabled: boolean
    soundMode?: "siren" | "beep"          // novo
    repeatSoundMs?: number                // novo (0 => desativa repetição)

    // Webhook
    webhookEnabled?: boolean              // novo (false => não envia)
    repeatWebhookMs?: number              // novo (0 => desativa repetição)
    
    webhook: {
        method: WebhookMethod
        url: string
        headersText?: string
        contentType?: string
        body?: string
    }

    createdAt?: any
    createdBy?: string
    updatedAt?: any
    visible?: boolean
}

export type Totalizador = {
    id: string;
    data: any;
}

export type QueueMemberStatusItem = {
    id: string;
    data: any;
}

export type Estados = {
    alerta: string
    critico: string
}

export type FilaConfig = {
    estados?: Estados
    fila_importante?: boolean
}

export type PxFila = {
    id: string
    configuracao?: FilaConfig
    totalizadores?: Totalizador
    queueMemberStatus?: QueueMemberStatusItem[]
}

export type PxDash = {
    id?: string
    accountcode: string
    nome: string
    descricao?: string
    thema?: "dark" | "light" | "dark-high-contrast" | "light-high-contrast"
    configuracao?: { estados?: Estados }
    filas?: PxFila[]
    visible: boolean
    createdBy: string // ID do usuário que criou
    private?: boolean // Se true, só o criador pode ver
}