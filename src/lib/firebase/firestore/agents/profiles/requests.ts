import { doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { getProfileRequestsCollection } from ".";

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
