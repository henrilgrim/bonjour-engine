import { FirestoreDataConverter, serverTimestamp } from "firebase/firestore"
import { PxAlertConfig, PxDash } from "./types"

export const alertsConverter: FirestoreDataConverter<PxAlertConfig> = {
    toFirestore(d: PxAlertConfig) {
        const { id, createdAt, ...rest } = d
        return {
            ...rest,
            // preserva createdAt existente, senão cria
            createdAt: createdAt ?? serverTimestamp(),
            updatedAt: serverTimestamp(),
        } as any
    },
    fromFirestore(snap) {
        const data = snap.data() as Omit<PxAlertConfig, "id">
        return { id: snap.id, ...data }
    },
}

export const dashboardConverter: FirestoreDataConverter<PxDash> = {
    toFirestore(d: PxDash) {
        const { id, ...rest } = d
        return rest as any
    },
    fromFirestore(snap) {
        const data = snap.data() as Omit<PxDash, "id">
        return { id: snap.id, ...data }
    },
}