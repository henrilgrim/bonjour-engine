import { Timestamp } from "firebase/firestore"

export const toDateSafe = (t: any): Date => {
    if (t && typeof t.toDate === "function") return t.toDate()
    if (t instanceof Date) return t
    if (typeof t === "number") return new Date(t)
    if (typeof t === "string") {
        const d = new Date(t)
        if (!isNaN(d.getTime())) return d
    }
    return new Date()
}

export const formatTime = (d?: Date | Timestamp | null): string => {
    let date: Date | null = null
    if (!d) return "--:--"
    if (d instanceof Date) date = d
    else if (typeof d === "object" && typeof d.seconds === "number") date = new Date(d.seconds * 1000)
    if (!date || isNaN(date.getTime())) return "--:--"
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export const formatDate = (input?: Date | Timestamp | null): string => {
    let date: Date | null = null
    if (!input) return "Data inválida"
    if (input instanceof Date) date = input
    else if (typeof input === "object" && typeof input.seconds === "number") date = new Date(input.seconds * 1000)
    if (!date || isNaN(date.getTime())) return "Data inválida"

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    if (date.toDateString() === today.toDateString()) return "Hoje"
    if (date.toDateString() === yesterday.toDateString()) return "Ontem"
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}