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
import { PauseRequestList, Profile } from "./types";

/* =========================
 * Converters
 * =======================*/
import { profileConverter, profileRequestConverter } from "./converters";

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

// Collection de requisições de pausas dentro de Profile
export function getProfileRequestsCollection(
    accountcode: string,
    ProfileId: string
): CollectionReference<PauseRequestList> {
    return collection(
        getProfileDoc(accountcode, ProfileId),
        "requests"
    ).withConverter(profileRequestConverter);
}

/* =========================
 * CRUD Helpers – Requests
 * =======================*/
export { listProfileRequests } from "./requests";
