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

// FUNÇÃO REMOVIDA: subscribeAllAccountMessagesStream
// Esta função criava listeners aninhados problemáticos que causavam memory leaks.
// Use o pool de listeners otimizados em seu lugar.

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
