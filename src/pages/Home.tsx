import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import DashboardStats from "@/components/home/DashboardStats"
import { listenCompanyQueues, listenCompanyTotalizersQueues } from "@/lib/firebase/realtime/company"
import { useMonitoringDashStore } from "@/store/monitoringDashStore"
import { QueueStatusMap, reorganizarEAgrouparQueueMemberStatus } from "@/utils/transform-queue"
import { transformarQueuesMonitoring } from "@/utils/transform-queue-monitoting"
import { useQueuesStore } from "@/store/queuesStore"
import { combinarQueueStatusETotalizadores, QueueMapCombinado } from "@/utils/another"
import QueueCard from "@/components/home/QueueCard"
import TrafficLight from "@/components/home/TrafficLight"
import { useUiTheme } from "@/contexts/ui-theme"

export default function HomePage() {
    const navigate = useNavigate()
    const { dashSelected } = useMonitoringDashStore()

    useEffect(() => {
        if (!dashSelected) navigate("/select-dash", { replace: true })
    }, [dashSelected, navigate])

    if (!dashSelected) return null

    // Consome do contexto (em vez de controlar aqui):
    const { isMonitorMode: isTV } = useUiTheme()

    const [cols, setCols] = useState<1 | 2 | 3 | 4>(3)
    useEffect(() => {
        const saved = localStorage.getItem("queueGridColsFixed")
        if (["1", "2", "3", "4"].includes(saved || "")) {
            setCols(Number(saved) as 1 | 2 | 3 | 4)
        }
    }, [])
    useEffect(() => {
        localStorage.setItem("queueGridColsFixed", String(cols))
    }, [cols])

    const [queuesMonitoringCombined, setQueuesMonitoringCombined] = useState<QueueMapCombinado>({})
    const { items: filasStore } = useQueuesStore()

    const [queueMemberStatus, setQueueMemberStatus] = useState<QueueStatusMap>({})
    const [totalizadoresByQueue, setTotalizadoresByQueue] = useState<any[]>([])

    useEffect(() => {
        if (!dashSelected?.accountcode) return
        const off = listenCompanyQueues(
            dashSelected.accountcode,
            (queues) => setQueueMemberStatus(reorganizarEAgrouparQueueMemberStatus(queues, dashSelected.filas)),
            (err) => console.error("Erro listener:", err),
        )

        const off2 = listenCompanyTotalizersQueues(
            dashSelected.accountcode,
            (queues) => {
                const retorno = queues
                    .filter((q) => q.data.queue)
                    .map((q) => ({
                        queue: q.data.queue,
                        media_tma: parseFloat(String(q.data.media_tma || 0)),
                        media_tme: parseFloat(String(q.data.media_tme || 0)),
                        recebidas_abandonadas_na_fila: parseInt(String(q.data.recebidas_abandonadas_na_fila || 0)),
                        recebidas_atendidas_na_fila: parseInt(String(q.data.recebidas_atendidas_na_fila || 0)),
                    }))
                setTotalizadoresByQueue(retorno)
            },
            (err) => console.error("Erro listener:", err),
        )

        return () => { off(); off2() }
    }, [dashSelected?.accountcode, dashSelected?.filas])

    useEffect(() => {
        setQueuesMonitoringCombined(
            combinarQueueStatusETotalizadores(queueMemberStatus, totalizadoresByQueue ?? [], { onlyFromStatus: true })
        )
    }, [queueMemberStatus, totalizadoresByQueue])

    const filasTransformadas = useMemo(
        () => transformarQueuesMonitoring(queuesMonitoringCombined, filasStore, dashSelected),
        [queuesMonitoringCombined, filasStore, dashSelected]
    )

    const totalAgents = useMemo(() => filasTransformadas.reduce((acc, f) => acc + (f.totalAgents || 0), 0), [filasTransformadas])
    const totalBusyAgents = useMemo(() => filasTransformadas.reduce((acc, f) => acc + (f.busyAgents || 0), 0), [filasTransformadas])
    const totalPausedAgents = useMemo(() => filasTransformadas.reduce((acc, f) => acc + (f.pausedAgents || 0), 0), [filasTransformadas])
    const totalQueueSize = useMemo(() => filasTransformadas.reduce((acc, f) => acc + (f.queueSize || 0), 0), [filasTransformadas])
    const queues = useMemo(() => filasTransformadas.map((q) => ({ ...q })), [filasTransformadas])

    const getLevelFromConfig = (totalAgents: number, totalBusyAgents: number, totalPausedAgents: number, estados?: { alerta?: string | number; critico?: string | number }): "green" | "yellow" | "red" => {
        const toNum = (v: unknown, def: number) => {
            const n = Number(v)
            return Number.isFinite(n) ? n : def
        }

        let alerta = toNum(estados?.alerta, 70)
        let critico = toNum(estados?.critico, 100)

        const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
        alerta = clamp(alerta, 0, 99)
        critico = clamp(critico, 1, 100)
        if (critico <= alerta) critico = Math.min(100, alerta + 1)

        if (totalAgents <= 0) return "green"

        const pct = ((totalBusyAgents + totalPausedAgents) / totalAgents) * 100
        if (pct >= critico) return "red"
        if (pct >= alerta) return "yellow"
        return "green"
    }

    const level = getLevelFromConfig(totalAgents, totalBusyAgents, totalPausedAgents, dashSelected?.configuracao?.estados)
    const colorToken = ({ red: "traffic-red", yellow: "traffic-yellow", green: "traffic-green" } as const)[level]

    const hsl = (token: string, alpha?: number) => alpha !== undefined ? `hsl(var(--${token}) / ${alpha})` : `hsl(var(--${token}))`

    const leftColClass = isTV ? "lg:grid-cols-[880px_1fr]" : "lg:grid-cols-[520px_1fr]"
    const gridStyle: React.CSSProperties = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }

    const ControlButton = ({ v }: { v: 1 | 2 | 3 | 4 }) => {
        const active = cols === v
        return (
            <button type="button" onClick={() => setCols(v)} className={[
                    "px-2.5 py-1.5 rounded-md text-xs font-medium border transition",
                    active ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted",
                ].join(" ")}
                aria-pressed={active}
                title={`${v} coluna${v > 1 ? "s" : ""}`}
            >
                {v}
            </button>
        )
    }

    const ringGlow =
        level === "red"
            ? `0 0 0 6px ${hsl(colorToken, .55)}, 0 0 28px 10px ${hsl(colorToken, .35)}`
            : level === "yellow"
                ? `0 0 0 4px ${hsl(colorToken, .45)}, 0 0 22px 8px ${hsl(colorToken, .28)}`
                : `0 0 0 3px ${hsl(colorToken, .35)}, 0 0 18px 6px ${hsl(colorToken, .22)}`

    return (
        <div className={`relative mt-4 grid grid-cols-1 ${leftColClass} gap-6 rounded-2xl`}>
            <div className={isTV ? "space-y-6 lg:sticky lg:top-6" : "space-y-12 lg:sticky lg:top-6"}>
                {/* Card do Semáforo com borda pulsante */}
                <div className="relative">
                    <div aria-hidden className="pointer-events-none absolute -inset-1.5 rounded-2xl animate-pulse" style={{ border: `2px solid ${hsl(colorToken)}`, boxShadow: ringGlow }} />
                    {level === "red" && (
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -inset-6 rounded-[1.75rem] opacity-30"
                            style={{
                                background: `radial-gradient(60% 60% at 50% 50%, ${hsl(colorToken, .35)} 0%, transparent 70%)`,
                                filter: "blur(8px)",
                            }}
                        />
                    )}

                    <div className="relative isolate overflow-hidden rounded-2xl">
                        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 animate-pulse" style={{
                            background: `radial-gradient(120% 120% at 50% 40%, ${hsl(colorToken)} 35%, transparent 70%)`,
                            filter: `blur(${isTV ? 28 : 18}px)`,
                            opacity: isTV ? 0.38 : 0.25,
                        }} />

                        <div className="relative bg-card rounded-2xl border shadow-sm p-4 sm:p-5" style={{ borderColor: hsl("border") }}>
                            <div style={{ transform: `scale(1.08)`, transformOrigin: "top center" }}>
                                <TrafficLight
                                    accountcode={dashSelected.accountcode}
                                    totalAgents={totalAgents}
                                    busyAgents={totalBusyAgents}
                                    pausedAgents={totalPausedAgents}
                                    estados={dashSelected?.configuracao?.estados}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DashboardStats
                    totalAgents={totalAgents}
                    totalBusyAgents={totalBusyAgents}
                    totalPausedAgents={totalPausedAgents}
                    totalQueueSize={totalQueueSize}
                    tv={isTV}
                />
            </div>

            {/* Direita: toolbar + grid filas */}
            <div className="w-full">
                <div className="mb-3 flex items-center justify-end gap-1.5">
                    <span className="text-xs text-muted-foreground mr-1">Colunas:</span>
                    <ControlButton v={1} />
                    <ControlButton v={2} />
                    <ControlButton v={3} />
                    <ControlButton v={4} />
                </div>

                <div role="list" className="grid auto-rows-fr gap-3 sm:gap-4 lg:gap-5" style={gridStyle}>
                    {queues.map((q) => (
                        <div key={q.id} role="listitem" className="min-w-0">
                            <QueueCard
                                name={q.name}
                                totalAgents={q.totalAgents}
                                activeAgents={q.availableAgents}
                                queueSize={q.queueSize}
                                filaData={q}
                                onSaveConfig={() => { }}
                            />
                        </div>
                    ))}
                    {queues.length === 0 && (
                        <div className="col-span-full text-center text-sm text-muted-foreground py-10">
                            Nenhuma fila para exibir.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
