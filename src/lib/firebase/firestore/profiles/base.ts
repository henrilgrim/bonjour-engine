import {
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import {
    getProfileDoc,
    getProfilesCollection,
    listProfileConfigurations,
    // getProfileConfiguration,
} from ".";
import { Profile } from "./types";
import { profileConverter } from "./converters";
import { registerFirestoreListener } from "../listeners";

export async function createProfile(
    profileId: string,
    accountcode: string,
    data: Omit<Profile, "accountcode" | "createdAt" | "updatedAt">
) {
    const col = getProfilesCollection(accountcode);

    const payload: Profile = {
        userId: profileId,
        accountcode,
        ...data,
        isActive: data.isActive ?? true,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
    };

    const ref = doc(col, profileId);
    await setDoc(ref, profileConverter.toFirestore(payload) as any);

    return ref.id; // aqui vai ser exatamente o profileId
}

// Upsert (idempotente) por ID conhecido
export async function upsertProfile(
    accountcode: string,
    profileId: string,
    data: Partial<Omit<Profile, "accountcode" | "createdAt" | "updatedAt">> & {
        createdBy?: string;
        updatedBy?: string;
    }
) {
    const ref = getProfileDoc(accountcode, profileId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        const base: Profile = {
            accountcode,
            userId: profileId,
            name: data.name ?? "Novo perfil",
            description: data.description ?? "",
            isActive: data.isActive ?? true,
            queues: data.queues ?? [],
            roles: data.roles ?? [],
            createdAt: serverTimestamp() as any,
            updatedAt: serverTimestamp() as any,
            createdBy: data.createdBy,
            updatedBy: data.updatedBy,
        };
        await setDoc(ref, profileConverter.toFirestore(base) as any);
    } else {
        await setDoc(
            ref,
            {
                ...data,
                accountcode, // mantém redundância correta
                updatedAt: serverTimestamp() as any,
            } as any,
            { merge: true }
        );
    }
    return ref.id;
}

// Garante que o doc exista (útil quando navega para um profile pela primeira vez)
export async function ensureProfileDoc(
    accountcode: string,
    profileId: string,
    defaults?: Partial<Profile>
) {
    const ref = getProfileDoc(accountcode, profileId);
    const s = await getDoc(ref);
    if (!s.exists()) {
        const base: Profile = {
            accountcode,
            userId: profileId ?? "",
            name: defaults?.name ?? "Novo perfil",
            description: defaults?.description ?? "",
            isActive: defaults?.isActive ?? true,
            queues: defaults?.queues ?? [],
            roles: defaults?.roles ?? [],
            createdAt: serverTimestamp() as any,
            updatedAt: serverTimestamp() as any,
            createdBy: defaults?.createdBy,
            updatedBy: defaults?.updatedBy,
        };
        await setDoc(ref, profileConverter.toFirestore(base) as any);
    }
    return ref;
}

export async function getProfile(accountcode: string, profileId: string) {
    const s = await getDoc(getProfileDoc(accountcode, profileId));
    return s.exists() ? s.data()! : null;
}

export async function getProfileByUserId(accountcode: string, userId: string) {
    const qy = query(
        getProfilesCollection(accountcode),
        orderBy("name", "asc")
    );
    const s = await getDocs(qy);
    const profile =
        s.docs.map((d) => d.data()).find((p) => p.userId === userId) || null;

    const config = await listProfileConfigurations(accountcode, profile.userId);
    if (config.length) profile.configurations = config;

    return profile;
}

export async function listProfiles(accountcode: string) {
    const qy = query(
        getProfilesCollection(accountcode),
        orderBy("name", "asc")
    );
    const s = await getDocs(qy);
    return s.docs.map((d) => d.data());
}

// export function watchProfiles(
//     accountcode: string,
//     cb: (profiles: Profile[]) => void
// ) {
//     const qy = query(
//         getProfilesCollection(accountcode),
//         orderBy("name", "asc")
//     );
//     return onSnapshot(qy, (snap) => {
//         cb(snap.docs.map((d) => d.data()));
//     });
// }

// export function watchProfiles(
//     accountcode: string,
//     cb: (profiles: Profile[]) => void
// ) {
//     const qy = query(
//         getProfilesCollection(accountcode),
//         orderBy("name", "asc")
//     );

//     const unsub = onSnapshot(qy, (snap) => {
//         cb(snap.docs.map((d) => d.data()));
//     });

//     registerFirestoreListener(unsub);
//     return unsub;
// }

export async function updateProfile(
    accountcode: string,
    profileId: string,
    patch: Partial<Omit<Profile, "accountcode" | "createdAt">>
) {
    await updateDoc(getProfileDoc(accountcode, profileId), {
        ...patch,
        accountcode,
        updatedAt: serverTimestamp() as any,
    } as any);
}
