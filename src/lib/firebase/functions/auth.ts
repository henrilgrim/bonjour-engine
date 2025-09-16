import { onAuthStateChanged, setPersistence, browserLocalPersistence, signInAnonymously, signOut, deleteUser, User } from "firebase/auth"
import { auth } from "@/config/firebase"

export type LogoutFirebaseOptions = {
    keepAnonymous?: boolean
}

let initPromise: Promise<User | null> | null = null
let signInPromise: Promise<User> | null = null

async function waitAuthInit(): Promise<User | null> {
    if (auth.currentUser !== null) return auth.currentUser
    if (!initPromise) {
        initPromise = new Promise<User | null>((resolve) => {
            const unsub = onAuthStateChanged(
                auth,
                (u) => {
                    unsub()
                    resolve(u)
                },
                (err) => {
                    console.error("onAuthStateChanged error:", err)
                    resolve(null)
                }
            )
        }).finally(() => { initPromise = null })
    }
    return initPromise
}

/**
 * Apenas garante que a sessão Firebase esteja inicializada e retorna o usuário atual (se houver).
 * NÃO cria usuário anônimo.
 */
export async function ensureFirebaseReady(): Promise<User | null> {
    await setPersistence(auth, browserLocalPersistence)
    return await waitAuthInit()
}

/**
 * Cria sessão anônima APENAS se ainda não houver usuário Firebase.
 * Use isso SOMENTE após o usuário do SEU APP estar autenticado.
 */
export async function ensureAnonymousSession(): Promise<User> {
    await setPersistence(auth, browserLocalPersistence)

    const existing = await waitAuthInit()
    if (existing) return existing

    if (!signInPromise) {
        signInPromise = signInAnonymously(auth)
            .then((cred) => cred.user)
            .catch((e: any) => {
                console.error("anonymous sign-in failed", {
                    code: e?.code,
                    message: e?.message,
                    origin: typeof window !== "undefined" ? window.location.origin : "ssr",
                    authDomain: auth.app.options.authDomain,
                    projectId: auth.app.options.projectId,
                })
                throw e
            })
            .finally(() => { signInPromise = null })
    }
    return signInPromise
}

/**
 * Encerra a sessão Firebase.
 * - Usuário normal: signOut.
 * - Usuário anônimo: signOut (keepAnonymous=true) ou deleteUser (keepAnonymous=false).
 */
export async function logoutFirebase(opts: LogoutFirebaseOptions = { keepAnonymous: true }) {
    const user = auth.currentUser
    if (!user) return

    try {
        if (user.isAnonymous) {
            if (opts.keepAnonymous) {
                await signOut(auth)
            } else {
                await deleteUser(user) // remove anônimo
            }
        } else {
            await signOut(auth)
        }
    } catch (e: any) {
        console.error("firebase logout failed", { code: e?.code, message: e?.message })
        try { await signOut(auth) } catch { }
    }
}
