export interface PauseRequest {
    agentLogin: string;
    createdAt: Date | string | number;
    reasonId: string;
    reasonName: string;
    status: "pending" | "approved" | "rejected" | "canceled";
    updatedAt: Date | string | number;
    userId: string;
    userName: string;
}

export function PresenceDot({ status }: { status?: string }) {
    const tone = status?.toLowerCase().includes("dispon")
        ? "bg-emerald-500"
        : status?.toLowerCase().includes("pausa")
        ? "bg-amber-500"
        : status?.toLowerCase().includes("ocup")
        ? "bg-rose-500"
        : "bg-zinc-400";
    return (
        <span
            className={[
                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card",
                tone,
            ].join(" ")}
            aria-label={`Status: ${status ?? "indefinido"}`}
            title={status}
        />
    );
}

export function badgeTone(status?: string) {
    const s = status?.toLowerCase() || "";
    if (s.includes("dispon"))
        return "border-emerald-300/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10";
    if (s.includes("pausa"))
        return "border-amber-300/40 text-amber-700 dark:text-amber-300 bg-amber-500/10";
    if (s.includes("ocup"))
        return "border-rose-300/40 text-rose-700 dark:text-rose-300 bg-rose-500/10";
    return "border-muted text-muted-foreground bg-muted/30";
}

export function statusBadgeTone(
    k: "pending" | "approved" | "rejected" | "canceled"
) {
    if (k === "approved")
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40";
    if (k === "rejected" || k === "canceled")
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300/40";
    return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40";
}

export function statusLabel(
    k: "pending" | "approved" | "rejected" | "canceled"
) {
    if (k === "approved") return "Aprovado";
    if (k === "rejected") return "Rejeitado";
    if (k === "canceled") return "Cancelado";
    return "Pendente";
}

export function toDateSafe(v: any): Date {
    if (!v) return new Date();
    if (v instanceof Date) return v;
    if (typeof v === "number") return new Date(v);
    if (typeof v === "string") {
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d;
    }
    if (v?.seconds) return new Date(v.seconds * 1000);
    if (typeof v?.toDate === "function") return v.toDate();
    return new Date();
}

export function formatDateTime(date: Date) {
    return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatTimeAgo(date: Date) {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}min atrás`;
    return "Agora";
}

export const REJECTION_REASONS = [
    "Não é necessário no momento",
    "Período de pico de atendimento",
    "Equipe reduzida",
    "Solicitação muito frequente",
    "Motivo não justificado",
    "Aguardar autorização superior",
];
