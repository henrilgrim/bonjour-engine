import {
    collection, addDoc, setDoc, getDocs, onSnapshot, updateDoc, query,
    orderBy, serverTimestamp, doc, getDoc, where, collectionGroup
} from "firebase/firestore"
import { ChatMessage, ChatMeta } from "./types"
import { chatMessageConverter, chatMetaConverter } from "./chatConverter"
import { getManagerPanelDoc } from ".."
import { firestore } from "@/config/firebase"

/* =========================
 * Collections & Docs
 * =======================*/

export function getChatsCollection(accountcode: string) {
    return collection(getManagerPanelDoc(accountcode), "chats").withConverter(chatMetaConverter)
}

export function getChatDoc(accountcode: string, chatId: string) {
    return doc(getChatsCollection(accountcode), chatId)
}

export function getMessagesCollection(accountcode: string, chatId: string) {
    return collection(getChatDoc(accountcode, chatId), "messages").withConverter(chatMessageConverter)
}

export function getGroupsCollection(accountcode: string) {
    return collection(getManagerPanelDoc(accountcode), "groups")
}

/* =========================
 * Helpers
 * =======================*/

function extractSupervisorIdFromChatId(chatId: string): string | null {
    // Formato: ag_${agentLogin}__sup_${supervisorId}
    const m = /^ag_(.+?)__sup_(.+)$/.exec(chatId)
    return m?.[2] ?? null
}

// Garante que a estrutura exista
async function ensureChatExists(params: { accountcode: string; chatId: string; agentLogin: string }) {
    const { accountcode, chatId, agentLogin } = params

    const managerRef = getManagerPanelDoc(accountcode)
    const managerSnap = await getDoc(managerRef)
    if (!managerSnap.exists()) {
        await setDoc(managerRef, { createdAt: serverTimestamp() }, { merge: true })
    }

    const chatRef = getChatDoc(accountcode, chatId)
    const chatSnap = await getDoc(chatRef)
    if (!chatSnap.exists()) {
        const meta: ChatMeta = {
            accountcode,
            agentLogin,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: "",
            lastSender: "system",
            lastAt: serverTimestamp(),
        }
        await setDoc(chatRef, meta)
    }
}

/* =========================
 * Mensagens (envio/leitura)
 * =======================*/

export async function sendMessage(accountcode: string, chatId: string, agentLogin: string, message: Omit<ChatMessage, "id">) {
    await ensureChatExists({ accountcode, chatId, agentLogin })

    const supervisorId = extractSupervisorIdFromChatId(chatId)
    const isAgent = (message as any).role === "agent"

    const col = getMessagesCollection(accountcode, chatId)
    await addDoc(col, {
        ...message,
        // campos adicionais p/ habilitar collectionGroup e filtros
        chatId,
        agentLogin,
        supervisorId: supervisorId ?? null,
        senderLogin: isAgent ? agentLogin : (message as any).senderLogin ?? null,
        createdAt: serverTimestamp(),
        read: false,
    } as any)

    await setDoc(
        getChatDoc(accountcode, chatId),
        {
            lastMessage: (message as any).content?.slice?.(0, 500) ?? "",
            lastSender: (message as any).role ?? "system",
            lastAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    )
}

export async function markMessageAsRead(accountcode: string, agentLogin: string, chatId: string, messageId: string) {
    await ensureChatExists({ accountcode, chatId, agentLogin })
    const messageRef = doc(getMessagesCollection(accountcode, chatId), messageId)
    await updateDoc(messageRef, { read: true })
}

export function subscribeToMessages(accountcode: string, chatId: string, onNext: (msgs: ChatMessage[]) => void, onError?: (e: unknown) => void) {
    const qy = query(getMessagesCollection(accountcode, chatId), orderBy("createdAt", "asc"))
    return onSnapshot(qy, snap => onNext(snap.docs.map(d => d.data())), err => onError?.(err))
}

export async function getAllMessages(accountcode: string, chatId: string): Promise<ChatMessage[]> {
    await ensureChatExists({ accountcode, chatId, agentLogin: "unknown" })
    const qy = query(getMessagesCollection(accountcode, chatId), orderBy("createdAt", "asc"))
    const snap = await getDocs(qy)
    return snap.docs.map(d => d.data())
}

export async function subscribeToAllMessagesForAgent_byEnumeratingChats(accountcode: string, agentLogin: string, onNext: (msgs: ChatMessage[]) => void, onError?: (e: unknown) => void): Promise<() => void> {
    try {
        // 1) Lista todos os chats e filtra pelo prefixo do agente (mesmo padrão do listChatsForAgent)
        const snap = await getDocs(query(getChatsCollection(accountcode)))
        const prefix = `ag_${agentLogin}__sup_`
        const chatIds = snap.docs
            .map(d => d.id)
            .filter(id => id.startsWith(prefix))

        // Nenhum chat? Emite vazio e retorna cleanup no-op
        if (chatIds.length === 0) {
            onNext([])
            return () => { }
        }

        // 2) Cache por chatId -> mensagens
        const messagesByChat = new Map<string, ChatMessage[]>()
        const unsubscribes: Array<() => void> = []

        const toMillis = (v: any): number => {
            if (!v) return 0
            if (typeof v === "number") return v
            const t = v?.toMillis?.()
            if (typeof t === "number") return t
            const d = new Date(v as any)
            const n = d.getTime?.()
            return typeof n === "number" && !Number.isNaN(n) ? n : 0
        }

        const emitMerged = () => {
            const merged: ChatMessage[] = []
            for (const arr of messagesByChat.values()) merged.push(...arr)
            merged.sort((a: any, b: any) => toMillis(a?.createdAt) - toMillis(b?.createdAt))
            onNext(merged)
        }

        // 3) Um onSnapshot por chatId (orderBy createdAt asc), mergeando tudo
        for (const chatId of chatIds) {
            const qy = query(
                getMessagesCollection(accountcode, chatId),
                orderBy("createdAt", "asc")
            )

            const unsub = onSnapshot(
                qy,
                snap => {
                    messagesByChat.set(chatId, snap.docs.map(d => d.data()))
                    emitMerged()
                },
                err => {
                    onError?.(err)
                    // Em erro, zera este chat para não “congelar” mensagens antigas
                    messagesByChat.set(chatId, [])
                    emitMerged()
                }
            )

            unsubscribes.push(unsub)
        }

        // 4) Retorna cleanup de todos os listeners
        return () => {
            unsubscribes.forEach(u => {
                try { u() } catch { }
            })
        }
    } catch (err) {
        onError?.(err)
        return () => { }
    }
}

/* =========================
 * Buscar lista de chats existentes
 * =======================*/

export async function listChatsForAgent(accountcode: string, agentLogin: string): Promise<ChatMeta[]> {
    // const qy = query(getChatsCollection(accountcode), where("agentLogin", "==", agentLogin), orderBy("updatedAt", "desc"))
    const qy = query(getChatsCollection(accountcode))
    const snap = await getDocs(qy)
    let retorno = snap.docs.map(d => d.data()).filter(c => c.id.startsWith(`ag_${agentLogin}__sup_`))
    retorno.sort((a, b) => {
        const ta = (a.updatedAt as any)?.toMillis?.() ?? new Date(a.updatedAt).getTime?.() ?? 0
        const tb = (b.updatedAt as any)?.toMillis?.() ?? new Date(b.updatedAt).getTime?.() ?? 0
        return tb - ta
    })

    return retorno;
}

/* =========================
 * Buscar mensagens não lidas
 * =======================*/

export async function getUnreadMessagesForAgent(accountcode: string, agentLogin: string): Promise<ChatMessage[]> {
    const qy = query(
        collectionGroup(firestore, "messages").withConverter(chatMessageConverter),
        where("agentLogin", "==", agentLogin),
        where("read", "==", false),
        orderBy("createdAt", "asc")
    )
    const snap = await getDocs(qy)
    return snap.docs.map(d => d.data())
}

/* =========================
 * Busca mensagens do agente
 * =======================*/

/**
 * Fallback (N queries) — descobre chats do agente e busca mensagens enviadas por ele em cada chat.
 * Útil para mensagens antigas que ainda não possuem `chatId/senderLogin`.
 */
export async function getAgentSentMessages_byEnumeratingChats(accountcode: string, agentLogin: string): Promise<ChatMessage[]> {
    // listar chats do agente
    const chatsQ = query(getChatsCollection(accountcode), where("agentLogin", "==", agentLogin))
    const chatsSnap = await getDocs(chatsQ)
    const chatIds = chatsSnap.docs.map(d => d.id)

    const all: ChatMessage[] = []
    for (const chatId of chatIds) {
        const qy = query(
            getMessagesCollection(accountcode, chatId),
            where("senderLogin", "==", agentLogin),
            orderBy("createdAt", "asc")
        )
        const snap = await getDocs(qy)
        all.push(...snap.docs.map(d => d.data()))
    }

    // ordena consolidado por createdAt
    all.sort((a: any, b: any) => {
        const ta = (a.createdAt as any)?.toMillis?.() ?? new Date(a.createdAt).getTime?.() ?? 0
        const tb = (b.createdAt as any)?.toMillis?.() ?? new Date(b.createdAt).getTime?.() ?? 0
        return ta - tb
    })

    return all
}

/* =========================
 * Grupos
 * =======================*/

export async function createGroup(accountcode: string, groupName: string, memberIds: string[]) {
    const groupRef = await addDoc(getGroupsCollection(accountcode), {
        name: groupName,
        members: memberIds,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })
    return groupRef.id
}

export async function getGroupMessages(accountcode: string, groupId: string): Promise<ChatMessage[]> {
    const groupChatId = `group__${groupId}`
    return await getAllMessages(accountcode, groupChatId)
}

export async function sendGroupMessage(accountcode: string, groupId: string, agentLogin: string, message: Omit<ChatMessage, "id">) {
    const groupChatId = `group__${groupId}`
    await sendMessage(accountcode, groupChatId, agentLogin, message)
}
