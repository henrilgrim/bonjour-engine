import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
} from "firebase/firestore";
import { ProfileAgent } from "./types";
import { getProfileAgentsCollection } from "./index";

/* =========================
 * CRUD Helpers – Profile Agents
 * =======================*/

/**
 * Adiciona um agente ao perfil
 */
export async function addProfileAgent(
    accountcode: string,
    profileId: string,
    agent: Omit<ProfileAgent, "id">
): Promise<string> {
    const agentsCollection = getProfileAgentsCollection(accountcode, profileId);
    const docRef = await addDoc(agentsCollection, agent);
    return docRef.id;
}

/**
 * Atualiza ou cria um agente no perfil (upsert)
 */
export async function upsertProfileAgent(
    accountcode: string,
    profileId: string,
    agentId: string,
    agent: Omit<ProfileAgent, "id">
): Promise<void> {
    const agentsCollection = getProfileAgentsCollection(accountcode, profileId);
    const agentDoc = doc(agentsCollection, agentId);
    await setDoc(agentDoc, agent, { merge: true });
}

/**
 * Busca um agente específico do perfil
 */
export async function getProfileAgent(
    accountcode: string,
    profileId: string,
    agentId: string
): Promise<ProfileAgent | null> {
    const agentsCollection = getProfileAgentsCollection(accountcode, profileId);
    const agentDoc = doc(agentsCollection, agentId);
    const snapshot = await getDoc(agentDoc);

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data();
}

/**
 * Lista todos os agentes do perfil
 */
export async function listProfileAgents(
    accountcode: string,
    profileId: string
): Promise<ProfileAgent[]> {
    const agentsCollection = getProfileAgentsCollection(accountcode, profileId);
    const q = query(agentsCollection, orderBy("displayName"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data());
}

/**
 * Atualiza um agente do perfil
 */
export async function updateProfileAgent(
    accountcode: string,
    profileId: string,
    agentId: string,
    updates: Partial<Omit<ProfileAgent, "id">>
): Promise<void> {
    const agentsCollection = getProfileAgentsCollection(accountcode, profileId);
    const agentDoc = doc(agentsCollection, agentId);
    await updateDoc(agentDoc, updates);
}

/**
 * Remove um agente do perfil
 */
export async function deleteProfileAgent(
    accountcode: string,
    profileId: string,
    agentId: string
): Promise<void> {
    const agentsCollection = getProfileAgentsCollection(accountcode, profileId);
    const agentDoc = doc(agentsCollection, agentId);
    await deleteDoc(agentDoc);
}

/**
 * Busca agentes por login
 */
export async function getProfileAgentsByLogin(
    accountcode: string,
    profileId: string,
    login: string
): Promise<ProfileAgent[]> {
    const agentsCollection = getProfileAgentsCollection(accountcode, profileId);
    const q = query(agentsCollection, where("login", "==", login));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data());
}
