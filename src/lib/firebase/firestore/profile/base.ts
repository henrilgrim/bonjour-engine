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
import { getProfileDoc, getProfilesCollection } from ".";
import { Profile } from "./types";
import { profileConverter } from "./converters";

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

    return ref.id;
}

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
            isActive: data.isActive ?? true,
            createdAt: serverTimestamp() as any,
            updatedAt: serverTimestamp() as any,
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
            isActive: defaults?.isActive ?? true,
            createdAt: serverTimestamp() as any,
            updatedAt: serverTimestamp() as any,
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
