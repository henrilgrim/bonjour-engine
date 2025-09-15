export const hslVar = (token: string, alpha?: number) => alpha !== undefined ? `hsl(var(--${token}) / ${alpha})` : `hsl(var(--${token}))`

export function toTitleCase(str: string) {
    const small = new Set(["da", "de", "do", "das", "dos", "e"])
    return str
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        .split(" ")
        .map((p, i) => (i > 0 && small.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
        .join(" ")
}

export function firstLast(name: string) {
    const parts = name.trim().replace(/\s+/g, " ").split(" ").filter(Boolean)
    if (parts.length <= 1) return toTitleCase(parts[0] || name)
    const first = toTitleCase(parts[0])
    const last = toTitleCase(parts[parts.length - 1])
    return `${first} ${last}`
}

export function initials(name: string) {
    const parts = toTitleCase(name).split(" ").filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function parseMember(membername?: string) {
    const raw = membername ?? ""
    const [login, ...rest] = raw.split(":")
    const nome = rest.join(":").trim() || login || "—"
    return { login: login || "—", nome }
}

export const formatDuration = (ms: number) => {
    if (!Number.isFinite(ms) || ms < 0) ms = 0
    const totalSec = Math.floor(ms / 1000)
    const ss = totalSec % 60
    const totalMin = Math.floor(totalSec / 60)
    const mm = totalMin % 60
    const hh = Math.floor(totalMin / 60)
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
}

export const STATUS_UI = {
    "1": { color: "status-available", label: "Disponível" },
    "2": { color: "status-busy", label: "Em uso" },
    "3": { color: "status-busy", label: "Ocupado" },
    "5": { color: "status-unavailable", label: "Indisponível" },
    "6": { color: "status-ringing", label: "Tocando" },
    "7": { color: "status-busy", label: "Em uso e tocando" },
    "8": { color: "status-waiting", label: "Em espera" },
    "999": { color: "status-paused", label: "Em pausa" },
} as const
