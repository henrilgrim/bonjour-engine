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
}

export interface PauseRequestList {
    id: string;

    login: string;
    reasonId: string;
    reasonName: string;
    rejectionReason?: string;
    status?: "pending" | "approved" | "rejected";
    approvedBy?: string;

    updatedAt?: any;
    createdAt: any;

    nameWhoResponded?: string;
}
