import { doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { getProfileRequestsCollection } from ".";
import { profileRequestConverter } from "./converters";
import { PauseRequest } from "./types";
import { serverTimestamp } from "firebase/firestore";

export async function upsertProfileRequest(
    accountcode: string,
    profileId: string,
    key: string,
    data: Omit<PauseRequest, "id" | "createdAt" | "updatedAt">
) {
    const cfgRef = doc(
        getProfileRequestsCollection(accountcode, profileId),
        key
    );

    await setDoc(
        cfgRef,
        profileRequestConverter.toFirestore({
            ...data,
            id: key,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        } as PauseRequest) as any,
        { merge: true }
    );
    return key;
}

export async function getProfileRequest(
    accountcode: string,
    profileId: string,
    key: string
) {
    const s = await getDoc(
        doc(getProfileRequestsCollection(accountcode, profileId), key)
    );
    return s.exists() ? s.data()! : null;
}

export async function listProfileRequests(
    accountcode: string,
    profileId: string
) {
    const s = await getDocs(
        getProfileRequestsCollection(accountcode, profileId)
    );
    return s.docs.map((d) => d.data());
}

// export function watchProfileRequests(
//     accountcode: string,
//     profileId: string,
//     cb: (configs: PauseRequest[]) => void
// ) {
//     const qy = getProfileRequestsCollection(accountcode, profileId);
//     return onSnapshot(qy, (snap) => {
//         cb(snap.docs.map((d) => d.data()));
//     });
// }
