export interface NotificationReadStatus {
    readAt: number;
    agentLogin: string;
    agentName: string;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    targetAgents: string[];
    createdBy: string;
    createdByName: string;
    createdAt: number;
    readBy: Record<string, NotificationReadStatus>;
}

export interface NotificationInput {
    title: string;
    message: string;
    targetAgents: string[];
}