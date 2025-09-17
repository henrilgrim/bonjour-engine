export interface Profile {
    userId: string;
    name: string;
    accountcode: string;
    isActive: boolean;

    // timestamps
    createdAt?: any;
    updatedAt?: any;
}

export interface ProfileAgent {
    id: string;
    login: string;
    fullName: string;
    displayName: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface PauseRequestList {
    reasonName?: string;
    status: string;
    rejectionReason?: string;
    createdAt?: any;
    updatedAt?: any;
    nameWhoResponded?: string;
}
