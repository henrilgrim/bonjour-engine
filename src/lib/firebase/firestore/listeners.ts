type ListenerUnsub = () => void;

const firestoreListeners = new Set<ListenerUnsub>();

export function registerFirestoreListener(unsub: ListenerUnsub) {
    firestoreListeners.add(unsub);
}

export function clearFirestoreListeners() {
    for (const unsub of firestoreListeners) {
        try {
            unsub();
        } catch (err) {
            console.error("Erro ao cancelar listener Firestore:", err);
        }
    }
    firestoreListeners.clear();
}
