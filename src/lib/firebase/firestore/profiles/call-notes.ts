import {
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    doc,
} from "firebase/firestore";
import { CallNote } from "./types";
import { getProfileCallNotesCollection } from ".";

/* =========================
 * CRUD Helpers – Call Notes
 * =======================*/

export async function upsertCallNote(
    accountcode: string,
    profileId: string,
    ticketId: string,
    notes: string,
    updatedBy?: string
): Promise<void> {
    const ref = doc(
        getProfileCallNotesCollection(accountcode, profileId),
        ticketId
    );

    await setDoc(
        ref,
        {
            notes,
            updatedBy,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
        },
        { merge: true }
    );
}

export async function getCallNote(
    accountcode: string,
    profileId: string,
    ticketId: string
): Promise<CallNote | null> {
    const ref = doc(
        getProfileCallNotesCollection(accountcode, profileId),
        ticketId
    );
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
}

export async function deleteCallNote(
    accountcode: string,
    profileId: string,
    ticketId: string
): Promise<void> {
    const ref = doc(
        getProfileCallNotesCollection(accountcode, profileId),
        ticketId
    );
    await deleteDoc(ref);
}

export async function listCallNotes(
    accountcode: string,
    profileId: string
): Promise<CallNote[]> {
    const q = query(
        getProfileCallNotesCollection(accountcode, profileId),
        orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
}

// export function watchCallNotes(accountcode: string, profileId: string, callback: (notes: CallNote[]) => void, onError?: (error: Error) => void) {
//     const q = query(getProfileCallNotesCollection(accountcode, profileId), orderBy("createdAt", "desc"));
//     return onSnapshot(q,
//         (snap) => callback(snap.docs.map(d => d.data())),
//         onError
//     );
// }
