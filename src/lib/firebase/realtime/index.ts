import { ref } from "firebase/database";
import { database } from "@/config/firebase";

// Paths helpers
export const rtdbPaths = {
    base: (accountcode: string) => `pxtalk_call_center_module/${accountcode}`,
    managerPanel: (accountcode: string) =>
        `${rtdbPaths.base(accountcode)}/manager_panel`,
    agentPanel: (accountcode: string) =>
        `${rtdbPaths.base(accountcode)}/agent_panel`,
    monitorPanel: (accountcode: string) =>
        `${rtdbPaths.base(accountcode)}/monitor_panel`,

    onlines: (accountcode: string) =>
        `${rtdbPaths.managerPanel(accountcode)}/onlines`,
    userOnline: (accountcode: string, userId: string) =>
        `${rtdbPaths.onlines(accountcode)}/${userId}`,

    agentOnlines: (accountcode: string) =>
        `${rtdbPaths.agentPanel(accountcode)}/onlines`,
    pauses: (accountcode: string) =>
        `${rtdbPaths.agentPanel(accountcode)}/pauses`,
    pauseRequest: (accountcode: string, agentLogin: string) =>
        `${rtdbPaths.pauses(accountcode)}/${agentLogin}`,

    queueMemberStatus: (accountcode: string) =>
        `QueueMemberStatus/${accountcode}`,
    totalizadoresByQueue: (accountcode: string) =>
        `totalizadoresByQueue/${accountcode}`,
};

// Refs helpers
export const rtdbRefs = {
    onlines: (accountcode: string) =>
        ref(database, rtdbPaths.onlines(accountcode)),
    userOnline: (accountcode: string, userId: string) =>
        ref(database, rtdbPaths.userOnline(accountcode, userId)),

    agentOnlines: (accountcode: string) =>
        ref(database, rtdbPaths.agentOnlines(accountcode)),
    pauses: (accountcode: string) =>
        ref(database, rtdbPaths.pauses(accountcode)),
    pauseRequests: (accountcode: string, agentLogin: string) =>
        ref(database, rtdbPaths.pauseRequest(accountcode, agentLogin)),

    queueMemberStatus: (accountcode: string) =>
        ref(database, rtdbPaths.queueMemberStatus(accountcode)),
    totalizadoresByQueue: (accountcode: string) =>
        ref(database, rtdbPaths.totalizadoresByQueue(accountcode)),
};
