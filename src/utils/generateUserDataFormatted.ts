import { Agent } from "@/types/auth-store";

const removeBearers = (token: string) => {
    return token.replace(/^bearer\s+/, "").replace(/^\w+\s+/, "");
};

export default function generateUserDataFormatted(payload: any): Agent {
    let queues: { id: string; priority: number }[] = [];
    const { agent } = payload;

    if (agent.multipleQueuesEnabled) {
        queues = agent.queues.map((queue: any) => ({
            id: queue.queue,
            priority: queue.priority || 0,
        }));
    } else if (agent.queues_id && agent.queues_id.length > 0) {
        queues = [
            {
                id: agent.queues_id[0],
                priority: agent.priority || 0,
            },
        ];
    }

    let token = removeBearers(payload.token);

    return {
        id: payload.agent._id,
        name: payload.agent.name,
        password: payload.agent.password,
        extension: payload.extension,
        login: payload.agent.login,
        token,
        queues,
        supervisor: {
            id: payload.agent.supervisor_id_on_service_login || "",
            name: payload.agent.supervisor_name_on_service_login || "",
        },
        correlation_type_id: payload.agentOperation._id,
        loginActionId: payload.actionid,
    };
}
