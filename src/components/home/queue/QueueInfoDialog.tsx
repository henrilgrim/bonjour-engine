import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { TransformedQueue } from "@/utils/transform-queue-monitoting"
import { useEffect, useMemo, useState } from "react"

type Agent = {
    dataevento?: string
    interface?: string
    location?: string
    membername?: string // "123:FULANO"
    paused?: string
    queue?: string
}

interface QueueInfoDialogProps {
    filaData: TransformedQueue
    // "disponivel" | "ocupado" | "pausa" | "emEspera"
    status: string
    open: boolean
    setOpen: (v: boolean) => void
}

const STATUS_META: Record<"disponivel" | "ocupado" | "pausa" | "emEspera", { title: string; codes: string[]; dotVar: string; bustVar: string }> = {
    disponivel: { title: "Agentes Disponíveis", codes: ["1"], dotVar: "traffic-green", bustVar: "traffic-green" },
    ocupado: { title: "Agentes Ocupados", codes: ["2", "3", "6", "7"], dotVar: "warning", bustVar: "warning" },
    emEspera: { title: "Agentes em Espera", codes: ["8"], dotVar: "warning", bustVar: "warning" },
    pausa: { title: "Agentes em Pausa", codes: ["999"], dotVar: "ring", bustVar: "ring" },
}

const Dot = ({ varName }: { varName: string }) => (
    <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `hsl(var(--${varName}))` }} />
)

const hslVar = (token: string, alpha?: number) => alpha !== undefined ? `hsl(var(--${token}) / ${alpha})` : `hsl(var(--${token}))`

function parseMember(membername?: string) {
    const raw = membername ?? ""
    const [ramal, ...rest] = raw.split(":")
    const nome = rest.join(":").trim() || ramal || "—"
    return { ramal: ramal || "—", nome }
}

function toTitleCase(str: string) {
    // minúsculas comuns em PT que geralmente ficam minúsculas no meio do nome
    const small = new Set(["da", "de", "do", "das", "dos", "e"])
    return str
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        .split(" ")
        .map((p, i) => (i > 0 && small.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
        .join(" ")
}

function firstLast(name: string) {
    const parts = name.trim().replace(/\s+/g, " ").split(" ").filter(Boolean)
    if (parts.length <= 1) return toTitleCase(parts[0] || name)
    const first = toTitleCase(parts[0])
    const last = toTitleCase(parts[parts.length - 1])
    return `${first} ${last}`
}

function initials(name: string) {
    const parts = toTitleCase(name).split(" ").filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatDuration(ms: number) {
    if (!Number.isFinite(ms) || ms < 0) ms = 0
    const totalSec = Math.floor(ms / 1000)
    const ss = totalSec % 60
    const totalMin = Math.floor(totalSec / 60)
    const mm = totalMin % 60
    const hh = Math.floor(totalMin / 60)
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
}


function Bust({ colorVar, label }: { colorVar: string; label: string }) {
    return (
        <div className="relative mx-auto h-14 w-14">
            <div className="absolute inset-0 rounded-full blur-md" style={{ background: hslVar(colorVar, 0.25) }} aria-hidden />
            <div className="absolute left-1/2 top-1 h-5 w-5 -translate-x-1/2 rounded-full shadow" style={{ backgroundColor: hslVar(colorVar) }} aria-hidden />
            <div className="absolute bottom-0 left-1/2 h-8 w-12 -translate-x-1/2 rounded-[999px] shadow" style={{ backgroundColor: hslVar(colorVar) }} aria-hidden />
            <div className="absolute inset-0 flex items-end justify-center pb-0.5">
                <span className="text-[10px] font-semibold text-white drop-shadow">{label}</span>
            </div>
        </div>
    )
}

export default function QueueInfoDialog({ open, setOpen, filaData, status }: QueueInfoDialogProps) {
    const [nowTs, setNowTs] = useState<number>(() => Date.now())

    useEffect(() => {
        if (!open) return
        setNowTs(Date.now()) // sincroniza ao abrir
        const id = setInterval(() => setNowTs(Date.now()), 1000)
        return () => clearInterval(id)
    }, [open])


    const key = (["disponivel", "ocupado", "pausa", "emEspera"] as const).includes(status as any)
        ? (status as "disponivel" | "ocupado" | "pausa" | "emEspera")
        : "disponivel"

    const meta = STATUS_META[key]

    const agents: Agent[] = useMemo(() => {
        const codes = new Set(meta.codes)
        const chunks = filaData.queueMemberStatus ?? []
        const list = chunks.flatMap(chunk => (codes.has(chunk.status) ? chunk.agentes : []))
        return [...list].sort((a, b) => {
            const pa = parseMember(a.membername)
            const pb = parseMember(b.membername)
            return (pa.nome || pa.ramal).localeCompare(pb.nome || pb.ramal, "pt-BR", { sensitivity: "base" })
        })
    }, [filaData.queueMemberStatus, meta.codes])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Dot varName={meta.dotVar} />
                        <span>{meta.title}</span>
                        <span className="ml-1 text-sm text-muted-foreground">({agents.length})</span>
                    </DialogTitle>
                    <DialogDescription asChild>
                        <div>Fila: <b>{filaData.name}</b></div>
                    </DialogDescription>
                </DialogHeader>

                {agents.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                        Nenhum agente neste status.
                    </div>
                ) : (
                    <TooltipProvider>
                        <div className="max-h-[60vh] overflow-auto nice-scroll">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {agents.map((ag, i) => {
                                    const { ramal, nome } = parseMember(ag.membername)
                                    const since = ag.dataevento ? new Date(ag.dataevento) : null
                                    const keyId = `${ag.interface || ag.location || ramal}-${i}`
                                    const display = firstLast(nome)
                                    const fullName = toTitleCase(nome)

                                    const elapsed = since ? formatDuration(nowTs - since.getTime()) : "—"

                                    return (
                                        <article
                                            key={keyId}
                                            className="rounded-xl border bg-card p-3 shadow-sm hover:shadow-md transition"
                                            style={{ borderColor: hslVar("border") }}
                                        >
                                            <div className="flex flex-col items-center text-center gap-2">
                                                <Bust colorVar={meta.bustVar} label={initials(fullName)} />

                                                {/* Nome com tooltip */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="min-w-0 max-w-[160px]">
                                                            <div className="font-medium truncate">{display}</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        <span className="max-w-xs break-words">{fullName}</span>
                                                    </TooltipContent>
                                                </Tooltip>

                                                {/* 
                                                <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                    Ramal {ramal} • {ag.interface || ag.location || "—"}
                                                </div> 
                                                */}

                                                <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                    Ramal {ramal}
                                                </div>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="font-mono text-sm font-semibold tracking-wider">
                                                            {elapsed}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        <span>
                                                            {since ? since.toLocaleString() : "Sem data do evento"}
                                                        </span>
                                                    </TooltipContent>
                                                </Tooltip>

                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        </div>
                    </TooltipProvider>
                )}
            </DialogContent>
        </Dialog>
    )
}
