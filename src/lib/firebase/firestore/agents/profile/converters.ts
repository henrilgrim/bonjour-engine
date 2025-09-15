import {
    DocumentData,
    FirestoreDataConverter,
    QueryDocumentSnapshot,
    SnapshotOptions,
    serverTimestamp,
} from "firebase/firestore";
import { AgentProfile, ManagerProfile } from "./types";

export const managerProfileConverter: FirestoreDataConverter<ManagerProfile> = {
    toFirestore(profile: ManagerProfile): DocumentData {
        return {
            ...profile,
            updatedAt: serverTimestamp(),
        };
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): ManagerProfile {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            ...data,
        } as ManagerProfile;
    },
};

export const agentProfileConverter: FirestoreDataConverter<AgentProfile> = {
    toFirestore(agent: AgentProfile): DocumentData {
        return {
            ...agent,
            updatedAt: serverTimestamp(),
        };
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): AgentProfile {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            ...data,
        } as AgentProfile;
    },
};