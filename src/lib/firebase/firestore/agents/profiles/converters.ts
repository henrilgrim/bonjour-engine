import { serverTimestamp, FirestoreDataConverter } from "firebase/firestore";
import { PauseRequestList, Profile } from "./types";

export const profileConverter: FirestoreDataConverter<Profile> = {
    toFirestore(p: Profile) {
        const { userId, ...rest } = p;
        return {
            ...rest,
            userId,
            updatedAt: serverTimestamp() as any,
            // createdAt é setado apenas em criação (nas helpers abaixo)
        };
    },
    fromFirestore(snap, options): Profile {
        const data = snap.data(options) as Omit<Profile, "id">;
        return { userId: snap.id, ...data };
    },
};

export const profileRequestConverter: FirestoreDataConverter<PauseRequestList> =
    {
        toFirestore(c: PauseRequestList) {
            const { id, ...rest } = c;
            return {
                ...rest,
                updatedAt: serverTimestamp() as any,
            };
        },
        fromFirestore(snap, options): PauseRequestList {
            const data = snap.data(options) as Omit<PauseRequestList, "id">;
            return { id: snap.id, ...data };
        },
    };
