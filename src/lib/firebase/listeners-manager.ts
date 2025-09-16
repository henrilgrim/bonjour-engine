/**
 * Sistema de gerenciamento de listeners do Firebase
 * 
 * Gerencia todos os listeners ativos (Firestore e Realtime Database)
 * e permite removê-los todos de uma vez no logout.
 */

type ListenerUnsub = () => void;

// Conjunto de listeners do Firestore
const firestoreListeners = new Set<ListenerUnsub>();

// Conjunto de listeners do Realtime Database
const realtimeListeners = new Set<ListenerUnsub>();

/**
 * Registra um listener do Firestore para ser gerenciado
 */
export function registerFirestoreListener(unsub: ListenerUnsub) {
    firestoreListeners.add(unsub);
}

/**
 * Registra um listener do Realtime Database para ser gerenciado
 */
export function registerRealtimeListener(unsub: ListenerUnsub) {
    realtimeListeners.add(unsub);
}

/**
 * Remove todos os listeners do Firestore
 */
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

/**
 * Remove todos os listeners do Realtime Database
 */
export function clearRealtimeListeners() {
    for (const unsub of realtimeListeners) {
        try {
            unsub();
        } catch (err) {
            console.error("Erro ao cancelar listener Realtime:", err);
        }
    }
    realtimeListeners.clear();
}

/**
 * Remove todos os listeners (Firestore e Realtime)
 */
export function clearAllListeners() {
    clearFirestoreListeners();
    clearRealtimeListeners();
    console.log("Todos os listeners Firebase foram removidos");
}

/**
 * Retorna o número de listeners ativos
 */
export function getActiveListenersCount() {
    return {
        firestore: firestoreListeners.size,
        realtime: realtimeListeners.size,
        total: firestoreListeners.size + realtimeListeners.size
    };
}