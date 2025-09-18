type ListenerUnsub = () => void;

const realtimeListeners = new Set<ListenerUnsub>();

export function registerRealtimeListener(unsub: ListenerUnsub) {
    realtimeListeners.add(unsub);
}

export function clearRealtimeListeners() {
    for (const unsub of realtimeListeners) {
        try {
            unsub();
        } catch (err) {
            console.error("Erro ao cancelar listener Realtime DB:", err);
        }
    }
    realtimeListeners.clear();
}
