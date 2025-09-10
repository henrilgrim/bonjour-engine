export interface Profile {
    accountcode: string; // redundante para fácil leitura em clientes/exports
    userId: string; // ID do usuário associado
    name: string;
    description?: string;
    isActive: boolean;

    // escopos/opções típicas (ajuste ao seu caso)
    queues?: string[];
    roles?: string[];

    // timestamps
    createdAt?: any;
    updatedAt?: any;

    // auditoria básica
    createdBy?: string; // uid
    updatedBy?: string; // uid

    // collections filhas:
    configurations?: ProfileConfiguration[];
    pauseRequests?: PauseRequest[];
}

export interface ProfileConfiguration {
    id: string; // == doc id
    key: string; // ex.: "maxPauseMinutes"
    value: unknown; // qualquer payload serializável
    updatedAt?: any;
    updatedBy?: string; // uid
}

export interface PauseRequest {
    id: string;

    login: string;
    reasonId: string;
    reasonName: string;
    rejectionReason?: string;
    status?: "pending" | "approved" | "rejected";
    approvedBy?: string;

    updatedAt?: any;
    createdAt: any;
}

export interface CallNote {
    id: string; // == ticket id da ligação
    notes: string; // conteúdo da anotação
    updatedAt?: any;
    createdAt?: any;
    updatedBy?: string; // uid do usuário que fez a anotação
}
