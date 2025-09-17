import {
    set,
    serverTimestamp,
    onDisconnect,
    Unsubscribe,
    onChildAdded,
    onChildChanged,
    onChildRemoved,
    DatabaseReference,
} from "firebase/database";
import {
    ensureAnonymousSession,
    ensureFirebaseReady,
} from "@/lib/firebase/functions/auth-firebase";
import { rtdbRefs } from "..";
import { User } from "@/store/authStore";
export async function loginInRTDB({ user }: { user: User }) {
    await ensureAnonymousSession();

    const user_id = user.id;
    const accountcode = user.accountcode;

    const userRef = rtdbRefs.userOnline(accountcode, user_id);

    await set(userRef, {
        id: user.id,
        name: user.nome,

        status: "logged", // "logged" | "offline" | "in_pause"

        lastLoginAt: serverTimestamp(),
    });
}

export function listenAgents(
    accountcode: string,
    handler: (agents: { id: string; data: any }[]) => void,
    onError?: (e: unknown) => void
): () => void {
    const baseRef: DatabaseReference = rtdbRefs.agentOnlines(accountcode);

    // estado local dos agentes
    const agents: Record<string, any> = {};

    const emit = () => {
        handler(
            Object.entries(agents).map(([id, data]) => ({
                id,
                data,
            }))
        );
    };

    const unsubs: Unsubscribe[] = [];

    unsubs.push(
        onChildAdded(
            baseRef,
            (snap) => {
                agents[snap.key!] = snap.val();
                emit();
            },
            (e) => onError?.(e)
        ),
        onChildChanged(
            baseRef,
            (snap) => {
                agents[snap.key!] = snap.val();
                emit();
            },
            (e) => onError?.(e)
        ),
        onChildRemoved(
            baseRef,
            (snap) => {
                delete agents[snap.key!];
                emit();
            },
            (e) => onError?.(e)
        )
    );

    return () => unsubs.forEach((u) => u());
}

export async function logoutInRTDB({
    user_id,
    accountcode,
}: {
    user_id: string;
    accountcode: string;
}) {
    const u = await ensureFirebaseReady();
    if (!u) return;

    const userRef = rtdbRefs.userOnline(accountcode, user_id);
    await set(userRef, null);

    try {
        await onDisconnect(userRef).cancel();
    } catch {}
}
