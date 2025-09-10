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
import { PauseRequest, Profile, ProfileConfiguration, CallNote } from "./types";

/* =========================
 * Converters
 * =======================*/
import {
    profileConfigConverter,
    profileConverter,
    profileRequestConverter,
    callNoteConverter,
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

// Collection de requisições de pausas dentro de Profile
export function getProfileRequestsCollection(
    accountcode: string,
    ProfileId: string
): CollectionReference<PauseRequest> {
    return collection(
        getProfileDoc(accountcode, ProfileId),
        "requests"
    ).withConverter(profileRequestConverter);
}

// Collection de notas de chamadas dentro de Profile
export function getProfileCallNotesCollection(
    accountcode: string,
    ProfileId: string
): CollectionReference<CallNote> {
    return collection(
        getProfileDoc(accountcode, ProfileId),
        "call_notes"
    ).withConverter(callNoteConverter);
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
    // watchProfiles,
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

/* =========================
 * CRUD Helpers – Requests
 * =======================*/
export {
    upsertProfileRequest,
    getProfileRequest,
    listProfileRequests,
    // watchProfileRequests,
} from "./requests";

/* =========================
 * CRUD Helpers – Call Notes
 * =======================*/
export {
    upsertCallNote,
    getCallNote,
    deleteCallNote,
    listCallNotes,
    // watchCallNotes,
} from "./call-notes";
