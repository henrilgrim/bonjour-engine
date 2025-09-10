import { doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { getProfileConfigurationsCollection } from ".";
import { profileConfigConverter } from "./converters";
import { ProfileConfiguration } from "./types";

// upsert de uma configuração por key (ID = key para evitar duplicidade)
export async function upsertProfileConfiguration(
    accountcode: string,
    profileId: string,
    key: string,
    value: unknown,
    updatedBy?: string
) {
    const cfgRef = doc(
        getProfileConfigurationsCollection(accountcode, profileId),
        key
    );
    console.log("Upserting profile configuration", {
        accountcode,
        profileId,
        key,
        value,
        updatedBy,
    });
    await setDoc(
        cfgRef,
        profileConfigConverter.toFirestore({
            id: key,
            key,
            value,
            updatedBy,
        } as ProfileConfiguration) as any,
        { merge: true }
    );
    return key;
}

export async function getProfileConfiguration(
    accountcode: string,
    profileId: string,
    key: string
) {
    const s = await getDoc(
        doc(getProfileConfigurationsCollection(accountcode, profileId), key)
    );
    return s.exists() ? s.data()! : null;
}

export async function listProfileConfigurations(
    accountcode: string,
    profileId: string
) {
    const s = await getDocs(
        getProfileConfigurationsCollection(accountcode, profileId)
    );
    return s.docs.map((d) => d.data());
}

// export function watchProfileConfigurations(accountcode: string, profileId: string, cb: (configs: ProfileConfiguration[]) => void) {
//     const qy = getProfileConfigurationsCollection(accountcode, profileId);
//     return onSnapshot(qy, (snap) => {
//         cb(snap.docs.map(d => d.data()));
//     });
// }
