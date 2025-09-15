import {
    collection,
    doc,
    DocumentReference,
    CollectionReference,
} from "firebase/firestore";
import { getManagerPanelDoc } from "../..";
import { AgentProfile, ManagerProfile } from "./types";
import { managerProfileConverter, agentProfileConverter } from "./converters";

// Profile document reference
export function getProfileDoc(
    accountcode: string
): DocumentReference<ManagerProfile> {
    return doc(getManagerPanelDoc(accountcode), "profile", "main").withConverter(
        managerProfileConverter
    );
}

// Agents collection within profile
export function getProfileAgentsCollection(
    accountcode: string
): CollectionReference<AgentProfile> {
    return collection(
        getProfileDoc(accountcode),
        "agents"
    ).withConverter(agentProfileConverter);
}

// Specific agent document
export function getProfileAgentDoc(
    accountcode: string,
    agentId: string
): DocumentReference<AgentProfile> {
    return doc(getProfileAgentsCollection(accountcode), agentId);
}

export { getSelectedAgents, saveSelectedAgents, clearSelectedAgents } from "./services";