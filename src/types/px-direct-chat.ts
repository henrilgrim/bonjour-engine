import { Timestamp } from "firebase/firestore"

export const buildAgentChatId = (login: string) => {
    return `ag_login_${String(login).trim()}`
}

export type Role = "agent" | "supervisor" | "system"
export type MsgType = "text" | "status" | "notification"

export type ChatMeta = {
    id?: string
    accountcode: string
    agentLogin: string
    agentPassword?: string
    participants?: string[] // novo
    chatType?: "private" | "group" // novo

    createdAt?: Timestamp | any
    updatedAt?: Timestamp | any
    lastMessage?: string
    lastSender?: Role
    lastAt?: Timestamp | any
    unreadCount?: number // opcional
}

export type ChatMessage = {
    id?: string
    accountcode: string
    groupId?: string // novo
    role: Role
    content: string
    type: MsgType
    senderId: string
    senderName: string
    receiverId?: string // novo
    createdAt?: Timestamp
    read?: boolean
    attachments?: any[] // futuro
}