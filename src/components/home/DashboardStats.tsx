import React, { memo, useMemo } from "react"

type NumberLike = number | null | undefined

interface DashboardStatsProps {
	totalAgents: NumberLike
	totalBusyAgents: NumberLike
	totalQueueSize: NumberLike
	totalPausedAgents: NumberLike // opcional, se não for usado
	loading?: boolean
	tv?: boolean // ativa escala para TV
}

const nf = new Intl.NumberFormat()
const clamp0 = (n: NumberLike) => Math.max(0, Number(n ?? 0))
const hsl = (token: string, alpha?: number) => alpha !== undefined ? `hsl(var(--${token}) / ${alpha})` : `hsl(var(--${token}))`

type StatsCardProps = {
	label: string
	value: number
	tintToken?: "primary" | "ring" | "warning" | "accent"
	sublabel?: string
	loading?: boolean
	tv?: boolean
}

const StatsCard = memo(function StatsCard({ label, value, tintToken = "primary", sublabel, loading, tv }: StatsCardProps) {
	return (
		<div className={["min-w-0 bg-card rounded-lg text-center border shadow-sm hover:shadow transition-all duration-200", tv ? "p-3" : "p-6",].join(" ")}
			style={{ borderColor: hsl("border") }}
			aria-live="polite"
		>
			<div className={tv ? "text-sm text-muted-foreground font-semibold mb-1" : "text-[11px] text-muted-foreground font-medium mb-1"}>
				{label}
			</div>

			{loading ? (<div className={tv ? "mx-auto h-7 w-16 rounded bg-muted animate-pulse" : "mx-auto h-5 w-12 rounded bg-muted animate-pulse"} />) : (
				<div className={tv ? "font-extrabold text-3xl leading-none" : "font-bold text-2xl leading-none"} style={{ color: hsl(tintToken) }}>
					{nf.format(value)}
				</div>
			)}
		</div>
	)
})

export default function DashboardStats({ totalAgents, totalBusyAgents, totalPausedAgents, totalQueueSize, loading = false, tv = false }: DashboardStatsProps) {
	const { total, busy, available, paused, busyPct, availablePct } = useMemo(() => {
		const total = clamp0(totalAgents)
		const busy = Math.min(clamp0(totalBusyAgents), total)
		const paused = clamp0(totalPausedAgents)
		const available = Math.max(0, total - busy - paused)
		const queue = clamp0(totalQueueSize)
		const busyPct = total > 0 ? (busy / total) * 100 : 0
		const availablePct = total > 0 ? (available / total) * 100 : 0

		return { total, busy, available, paused, queue, busyPct, availablePct }
	}, [totalAgents, totalBusyAgents, totalPausedAgents, totalQueueSize])

	// mesmo layout “2 por linha” da versão antiga; só maior no TV
	const gridCls = tv ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 gap-4"

	return (
		<div className={gridCls}>
			<StatsCard label="Total de Agentes" value={total} tintToken="primary" loading={loading} tv={tv} />
			<StatsCard label="Agentes Disponíveis" value={available} tintToken="ring" sublabel={total > 0 ? `${Math.round(availablePct)}% do total` : undefined} loading={loading} tv={tv} />
			<StatsCard label="Agentes Ocupados" value={busy} tintToken="warning" sublabel={total > 0 ? `${Math.round(busyPct)}% do total` : undefined} loading={loading} tv={tv} />
			<StatsCard label="Agentes em Pausa" value={paused} tintToken="warning" loading={loading} tv={tv} />
		</div>
	)
}
