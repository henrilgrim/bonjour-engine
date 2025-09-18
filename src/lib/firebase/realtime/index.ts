import { ref } from "firebase/database";
import { database } from "@/config/firebase";

// Paths helpers
export const rtdbPaths = {
    base: (accountcode: string) => `pxtalk_call_center_module/${accountcode}`,
    agentPanel: (accountcode: string) =>
        `${rtdbPaths.base(accountcode)}/agent_panel`,
    managerPanel: (accountcode: string) =>
        `${rtdbPaths.base(accountcode)}/manager_panel`,

    onlines: (accountcode: string) =>
        `${rtdbPaths.agentPanel(accountcode)}/onlines`,
    onlinesInPanel: (accountcode: string) =>
        `${rtdbPaths.managerPanel(accountcode)}/onlines`,
    agentOnline: (accountcode: string, agentLogin: string) =>
        `${rtdbPaths.onlines(accountcode)}/${agentLogin}`,
    supervisorsOnline: (accountcode: string) =>
        `${rtdbPaths.managerPanel(accountcode)}/onlines`,

    pauses: (accountcode: string) =>
        `${rtdbPaths.agentPanel(accountcode)}/pauses`,
    pauseRequest: (accountcode: string, agentLogin: string) =>
        `${rtdbPaths.pauses(accountcode)}/${agentLogin}`,

    notifications: (accountcode: string) =>
        `${rtdbPaths.managerPanel(accountcode)}/notifications`,
    notification: (accountcode: string, notificationId: string) =>
        `${rtdbPaths.notifications(accountcode)}/${notificationId}`,
};

// Refs helpers
export const rtdbRefs = {
    onlines: (accountcode: string) =>
        ref(database, rtdbPaths.onlines(accountcode)),
    agentOnline: (accountcode: string, agentLogin: string) =>
        ref(database, rtdbPaths.agentOnline(accountcode, agentLogin)),

    onlines2: (accountcode: string) =>
        ref(database, rtdbPaths.onlinesInPanel(accountcode)),
    supervisorsOnline: (accountcode: string) =>
        ref(database, rtdbPaths.supervisorsOnline(accountcode)),

    pauses: (accountcode: string) =>
        ref(database, rtdbPaths.pauses(accountcode)),
    pauseRequests: (accountcode: string, agentLogin: string) =>
        ref(database, rtdbPaths.pauseRequest(accountcode, agentLogin)),

    notifications: (accountcode: string) =>
        ref(database, rtdbPaths.notifications(accountcode)),
    notification: (accountcode: string, notificationId: string) =>
        ref(database, rtdbPaths.notification(accountcode, notificationId)),
};
