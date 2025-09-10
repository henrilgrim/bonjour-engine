export type Agent = {
    id: string;
    name: string;
    token: string;

    login: string;
    password: string;

    extension: string;

    queues: { id: string; priority: number }[];

    supervisor: { id: string; name: string };

    correlation_type_id: string;
    loginActionId: string;
};
