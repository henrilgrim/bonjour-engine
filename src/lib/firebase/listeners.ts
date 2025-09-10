import { clearFirestoreListeners } from "./firestore/listeners";
import { clearRealtimeListeners } from "./realtime/listeners";

export function clearAllFirebaseListeners() {
    clearFirestoreListeners();
    clearRealtimeListeners();
}
