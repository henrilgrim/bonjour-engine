import {
    collection,
    doc,
    DocumentReference,
    CollectionReference,
} from "firebase/firestore";
import { getAgentPanelDoc } from "..";

/* =========================
 * Types
 * =======================*/
import { Profile, ProfileAgent, ProfileConfiguration } from "./types";

/* =========================
 * Converters
 * =======================*/
import {
    profileConverter,
    profileConfigConverter,
    profileAgentConverter,
} from "./converters";

/* =========================
 * Paths (mantêm sua assinatura)
 * =======================*/

// Collection de Profiles
export function getProfilesCollection(
    accountcode: string
): CollectionReference<Profile> {
    return collection(getAgentPanelDoc(accountcode), "profiles").withConverter(
        profileConverter
    );
}

// Documento de um Profile específico
export function getProfileDoc(
    accountcode: string,
    ProfileId: string
): DocumentReference<Profile> {
    return doc(getProfilesCollection(accountcode), ProfileId);
}

// Collection de configurações dentro do Profile
export function getProfileConfigurationsCollection(
    accountcode: string,
    ProfileId: string
): CollectionReference<ProfileConfiguration> {
    return collection(
        getProfileDoc(accountcode, ProfileId),
        "configurations"
    ).withConverter(profileConfigConverter);
}

// Collection de configurações dentro do Profile
export function getProfileAgentsCollection(
    accountcode: string,
    ProfileId: string
): CollectionReference<ProfileAgent> {
    return collection(
        getProfileDoc(accountcode, ProfileId),
        "agents"
    ).withConverter(profileAgentConverter);
}

/* =========================
 * CRUD Helpers – Profiles
 * =======================*/
export {
    createProfile,
    ensureProfileDoc,
    upsertProfile,
    getProfile,
    getProfileByUserId,
    listProfiles,
    updateProfile,
} from "./base";

/* =========================
 * CRUD Helpers – Configurations
 * =======================*/
export {
    upsertProfileConfiguration,
    getProfileConfiguration,
    listProfileConfigurations,
    // watchProfileConfigurations,
} from "./configurations";
