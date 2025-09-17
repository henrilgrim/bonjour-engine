export type Role = "agent" | "supervisor" | "system"
export type MsgType = "text" | "status" | "notification"

export type ChatMeta = {
    id?: string
    accountcode: string
    agentLogin: string
    participants?: string[] // novo
    chatType?: "private" | "group" // novo

    createdAt?: any
    updatedAt?: any

    lastMessage?: string
    lastSender?: Role
    lastAt?: any
    unreadCount?: number // opcional
}

export type ChatMessage = {
    id?: string
    accountcode: string
    groupId?: string // novo
    role: Role
    type: MsgType
    content: string

    senderId: string
    senderName: string
    receiverId?: string // novo

    createdAt?: any
    read?: boolean
    attachments?: any[] // futuro
}
