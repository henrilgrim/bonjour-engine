export interface AgentProfile {
    id: string;
    login: string;
    fullName: string;
    displayName: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface ManagerProfile {
    id: string;
    userId: string;
    accountcode: string;
    createdAt?: any;
    updatedAt?: any;
}