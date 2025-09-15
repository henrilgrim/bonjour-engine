import {
    getDocs,
    setDoc,
    deleteDoc,
    serverTimestamp,
    writeBatch,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { getProfileAgentsCollection, getProfileAgentDoc, getProfileDoc } from ".";
import { AgentProfile, ManagerProfile } from "./types";

export async function getSelectedAgents(
    accountcode: string
): Promise<AgentProfile[]> {
    try {
        const snapshot = await getDocs(getProfileAgentsCollection(accountcode));
        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error getting selected agents:", error);
        return [];
    }
}

export async function saveSelectedAgents(
    accountcode: string,
    userId: string,
    agents: AgentProfile[]
): Promise<void> {
    try {
        const batch = writeBatch(firestore);

        // Ensure profile document exists
        const profileRef = getProfileDoc(accountcode);
        batch.set(profileRef, {
            id: "main",
            userId,
            accountcode,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        } as ManagerProfile, { merge: true });

        // Clear existing agents and add new ones
        const existingAgents = await getSelectedAgents(accountcode);
        
        // Delete existing agents
        for (const existingAgent of existingAgents) {
            const agentRef = getProfileAgentDoc(accountcode, existingAgent.id);
            batch.delete(agentRef);
        }

        // Add new agents
        for (const agent of agents) {
            const agentRef = getProfileAgentDoc(accountcode, agent.id);
            batch.set(agentRef, {
                ...agent,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }

        await batch.commit();
    } catch (error) {
        console.error("Error saving selected agents:", error);
        throw error;
    }
}

export async function clearSelectedAgents(accountcode: string): Promise<void> {
    try {
        const agents = await getSelectedAgents(accountcode);
        const batch = writeBatch(firestore);

        for (const agent of agents) {
            const agentRef = getProfileAgentDoc(accountcode, agent.id);
            batch.delete(agentRef);
        }

        await batch.commit();
    } catch (error) {
        console.error("Error clearing selected agents:", error);
        throw error;
    }
}