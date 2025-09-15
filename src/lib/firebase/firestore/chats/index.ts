import { collection, addDoc, setDoc, getDocs, onSnapshot, updateDoc, query, orderBy, serverTimestamp, doc, getDoc, Unsubscribe } from "firebase/firestore"
import { ChatMessage, ChatMeta } from "./types"
import { chatMessageConverter, chatMetaConverter } from "./converter"
import { getManagerPanelDoc } from ".."

type MessageEvent = {
    chatId: string
    message: ChatMessage
}

// Collection de chats
export function getChatsCollection(accountcode: string) {
    return collection(getManagerPanelDoc(accountcode), "chats").withConverter(chatMetaConverter)
}

// Documento de um chat específico
export function getChatDoc(accountcode: string, chatId: string) {
    return doc(getChatsCollection(accountcode), chatId)
}

// Collection de mensagens dentro do chat
export function getMessagesCollection(accountcode: string, chatId: string) {
    return collection(getChatDoc(accountcode, chatId), "messages").withConverter(chatMessageConverter)
}

// Collection de grupos
export function getGroupsCollection(accountcode: string) {
    return collection(getManagerPanelDoc(accountcode), "groups")
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

// Função para envio
export async function sendMessage(accountcode: string, chatId: string, agentLogin: string, message: Omit<ChatMessage, "id">) {
    await ensureChatExists({ accountcode, chatId, agentLogin, })

    const col = getMessagesCollection(accountcode, chatId)
    await addDoc(col, { ...message, createdAt: serverTimestamp(), read: false })

    await setDoc(getChatDoc(accountcode, chatId), {
        lastMessage: message.content.slice(0, 500),
        lastSender: message.role,
        lastAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    }, { merge: true })
}

export async function markMessageAsRead(accountcode: string, chatId: string, messageId: string) {
    await ensureChatExists({
        accountcode,
        chatId,
        agentLogin: "unknown",
    })

    const messageRef = doc(getMessagesCollection(accountcode, chatId), messageId)
    await updateDoc(messageRef, { read: true })
}

export function subscribeToMessages(accountcode: string, chatId: string, onNext: (msgs: ChatMessage[]) => void, onError?: (e: unknown) => void) {
    const q = query(getMessagesCollection(accountcode, chatId), orderBy("createdAt", "asc"))
    return onSnapshot(q, snap => onNext(snap.docs.map(d => d.data())), err => onError?.(err))
}

export function subscribeAllAccountMessages(accountcode: string, onNext: (grouped: Record<string, ChatMessage[]>) => void, onError?: (e: unknown) => void) {
    const chatsCol = getChatsCollection(accountcode)
    return onSnapshot(chatsCol, chatSnap => {
        const chatIds = chatSnap.docs.map(d => d.id)
        const allMessagesPromises = chatIds.map(chatId => getAllMessages(accountcode, chatId).then(msgs => ({ chatId, msgs })))
        Promise.all(allMessagesPromises).then(results => {
            const grouped: Record<string, ChatMessage[]> = {}
            results.forEach(({ chatId, msgs }) => {
                grouped[chatId] = msgs
            })
            onNext(grouped)
        }).catch(err => onError?.(err))
    }, err => onError?.(err))
}

export function subscribeAllAccountMessagesStream(accountcode: string, onEvent: (e: MessageEvent) => void, onError?: (e: unknown) => void): Unsubscribe {
    const unsubMap = new Map<string, Unsubscribe>()

    const chatsUnsub = onSnapshot(
        getChatsCollection(accountcode),
        (chatSnap) => {
            const currentChatIds = new Set(chatSnap.docs.map((d) => d.id))

            // remove chats que saíram
            for (const [chatId, unsub] of unsubMap) {
                if (!currentChatIds.has(chatId)) {
                    unsub()
                    unsubMap.delete(chatId)
                }
            }

            // adiciona listeners p/ novos chats
            for (const d of chatSnap.docs) {
                const chatId = d.id
                if (unsubMap.has(chatId)) continue

                const qMsgs = query(getMessagesCollection(accountcode, chatId), orderBy("createdAt", "asc"))
                const unsubMsgs = onSnapshot(
                    qMsgs,
                    (msgSnap) => {
                        for (const change of msgSnap.docChanges()) {
                            // ⬇️ anexa o id do doc
                            const data = change.doc.data()
                            const message = { id: change.doc.id, ...data } as ChatMessage
                            onEvent({ chatId, message })
                        }
                    },
                    (err) => onError?.(err)
                )

                unsubMap.set(chatId, unsubMsgs)
            }
        },
        (err) => onError?.(err)
    )

    return () => {
        chatsUnsub()
        for (const unsub of unsubMap.values()) unsub()
        unsubMap.clear()
    }
}

export async function getAllMessages(accountcode: string, chatId: string): Promise<ChatMessage[]> {
    await ensureChatExists({
        accountcode,
        chatId,
        agentLogin: "unknown",
    })

    const q = query(getMessagesCollection(accountcode, chatId), orderBy("createdAt", "asc"))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data())
}

// Grupos
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
