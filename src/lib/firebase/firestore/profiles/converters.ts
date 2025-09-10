import { serverTimestamp, FirestoreDataConverter } from "firebase/firestore";
import { PauseRequest, Profile, ProfileConfiguration, CallNote } from "./types";

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

export const profileConfigConverter: FirestoreDataConverter<ProfileConfiguration> =
    {
        toFirestore(c: ProfileConfiguration) {
            const { id, ...rest } = c;
            return {
                ...rest,
                updatedAt: serverTimestamp() as any,
            };
        },
        fromFirestore(snap, options): ProfileConfiguration {
            const data = snap.data(options) as Omit<ProfileConfiguration, "id">;
            return { id: snap.id, ...data };
        },
    };

export const profileRequestConverter: FirestoreDataConverter<PauseRequest> = {
    toFirestore(c: PauseRequest) {
        const { id, ...rest } = c;
        return {
            ...rest,
            updatedAt: serverTimestamp() as any,
        };
    },
    fromFirestore(snap, options): PauseRequest {
        const data = snap.data(options) as Omit<PauseRequest, "id">;
        return { id: snap.id, ...data };
    },
};

export const callNoteConverter: FirestoreDataConverter<CallNote> = {
    toFirestore(c: CallNote) {
        const { id, ...rest } = c;
        return {
            ...rest,
            updatedAt: serverTimestamp() as any,
        };
    },
    fromFirestore(snap, options): CallNote {
        const data = snap.data(options) as Omit<CallNote, "id">;
        return { id: snap.id, ...data };
    },
};
