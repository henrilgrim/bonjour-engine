import {
    serverTimestamp,
    FirestoreDataConverter,
    DocumentData,
    QueryDocumentSnapshot,
    SnapshotOptions,
} from "firebase/firestore";
import { Profile, ProfileAgent } from "./types";

export const profileConverter: FirestoreDataConverter<Profile> = {
    toFirestore(p: Profile) {
        const { userId, ...rest } = p;
        return {
            ...rest,
            userId,
            updatedAt: serverTimestamp() as any,
        };
    },
    fromFirestore(snap, options): Profile {
        const data = snap.data(options) as Omit<Profile, "id">;
        return { userId: snap.id, ...data };
    },
};

export const profileAgentConverter: FirestoreDataConverter<ProfileAgent> = {
    toFirestore(agent: ProfileAgent): DocumentData {
        return {
            ...agent,
            updatedAt: serverTimestamp(),
        };
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): ProfileAgent {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            ...data,
        } as ProfileAgent;
    },
};
