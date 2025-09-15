export interface Profile {
    userId: string;
    name: string;
    accountcode: string;
    isActive: boolean;

    // timestamps
    createdAt?: any;
    updatedAt?: any;
}

export interface ProfileConfiguration {
    id: string; // == doc id
    key: string; // ex.: "maxPauseMinutes"
    value: unknown; // qualquer payload serializável
    updatedAt?: any;
    updatedBy?: string; // uid
}

export interface ProfileAgent {
    id: string;
    login: string;
    fullName: string;
    displayName: string;
    createdAt?: any;
    updatedAt?: any;
}
