import { FirestoreDataConverter, serverTimestamp } from "firebase/firestore"
import { ChatMessage, MsgType, Role, ChatMeta } from "./types"

export const chatMessageConverter: FirestoreDataConverter<ChatMessage> = {
    toFirestore(msg) {
        const { id, ...rest } = msg
        return {
            ...rest,
            createdAt: msg.createdAt ?? serverTimestamp(),
        }
    },
    fromFirestore(snapshot) {
        const raw = snapshot.data() as any

        const content = raw.content ?? raw.message ?? ""
        const role: Role = raw.role ?? raw.senderType ?? "agent"
        const createdAt = raw.createdAt ?? raw.timestamp
        const type: MsgType = raw.type ?? "text"

        return {
            id: snapshot.id,
            accountcode: raw.accountcode,
            role,
            content,
            senderId: raw.senderId,
            senderName: raw.senderName,
            type,
            receiverId: raw.receiverId,
            groupId: raw.groupId,
            read: raw.read ?? false,
            createdAt,
            attachments: raw.attachments ?? [],
        }
    },
}

export const chatMetaConverter: FirestoreDataConverter<ChatMeta> = {
    toFirestore(d) {
        const { id, ...rest } = d
        return {
            ...rest,
            createdAt: d.createdAt ?? serverTimestamp(),
            updatedAt: serverTimestamp(),
        }
    },
    fromFirestore(snap) {
        const data = snap.data() as Omit<ChatMeta, "id">
        return { id: snap.id, ...data }
    },
}
