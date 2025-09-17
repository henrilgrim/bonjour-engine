import { getDocs } from "firebase/firestore";
import { getProfileRequestsCollection } from ".";

export async function listProfileRequests(
    accountcode: string,
    profileId: string
) {
    const s = await getDocs(
        getProfileRequestsCollection(accountcode, profileId)
    );

    let dados = s.docs.map((d) => d.data());

    console.log("[s]", dados);
    console.log("[profileId]", profileId);
    return dados;
}
