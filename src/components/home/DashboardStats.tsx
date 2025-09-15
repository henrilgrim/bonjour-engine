import { memo, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
	Users,
	CheckCircle,
	XCircle,
	PhoneCall,
	PhoneIncoming,
	Hourglass,
	Coffee,
	Clock,
} from "lucide-react"

type NumberLike = number | null | undefined

interface DashboardStatsProps {
	totalAgents: NumberLike
	availableAgents: NumberLike
	busyAgents: NumberLike
	ringingAgents: NumberLike
	waitingAgents: NumberLike
	pausedAgents: NumberLike
	unavailableAgents: NumberLike
	totalQueueSize: NumberLike
	loading?: boolean
}

const nf = new Intl.NumberFormat()
const clamp0 = (n: NumberLike) => Math.max(0, Number(n ?? 0))

type StatsCardProps = {
	label: string
	value: number | string
	icon: React.ElementType
}

const StatsCard = memo(function StatsCard({
	label,
	value,
	icon: Icon,
}: StatsCardProps) {
	return (
		<Card className="group shadow-none rounded-2xl bg-glass backdrop-blur-sm border border-glass-border hover:bg-surface-elevated/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-glow">
			<CardContent
				className={[
					// compacta em telas muito pequenas
					"p-2 sm:p-3 md:p-4",
					"flex items-center gap-3 sm:gap-4",
				].join(" ")}
			>
				<div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
					<Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
						{label}
					</p>
					<p className="text-base sm:text-lg font-bold text-foreground truncate tabular-nums">
						{value}
					</p>
				</div>
			</CardContent>
		</Card>
	)
})

export default function DashboardStats({ totalAgents, availableAgents, unavailableAgents, busyAgents, ringingAgents, waitingAgents, pausedAgents, totalQueueSize, loading = false }: DashboardStatsProps) {
	const { total, available, unavailable, busy, ringing, waiting, paused, queue } = useMemo(() => {
		const total = clamp0(totalAgents)
		const available = clamp0(availableAgents)
		const unavailable = clamp0(unavailableAgents)
		const busy = clamp0(busyAgents)
		const ringing = clamp0(ringingAgents)
		const waiting = clamp0(waitingAgents)
		const paused = clamp0(pausedAgents)
		const queue = clamp0(totalQueueSize)

		return { total, available, unavailable, busy, ringing, waiting, paused, queue }
	}, [totalAgents, availableAgents, unavailableAgents, busyAgents, ringingAgents, waitingAgents, pausedAgents, totalQueueSize])

	const stats = useMemo(() => ([
		{ label: "Total de Agentes", value: nf.format(total), icon: Users, color: "text-foreground" },
		{ label: "Disponíveis", value: nf.format(available), icon: CheckCircle, color: "status-available" },
		{ label: "Indisponíveis", value: nf.format(unavailable), icon: XCircle, color: "status-unavailable" },
		{ label: "Em Uso", value: nf.format(busy), icon: PhoneCall, color: "status-busy" },
		{ label: "Tocando", value: nf.format(ringing), icon: PhoneIncoming, color: "status-ringing" },
		{ label: "Em Espera", value: nf.format(waiting), icon: Hourglass, color: "status-waiting" },
		{ label: "Em Pausa", value: nf.format(paused), icon: Coffee, color: "status-paused" },
	]), [total, available, unavailable, busy, ringing, waiting, paused, queue])


	return (
		<div className="flex flex-col gap-4">
			<div className="text-center pb-2">
				<h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
					Estatísticas de Hoje
				</h3>
				<div className="w-10 sm:w-12 h-0.5 bg-gradient-to-r from-primary to-transparent mx-auto mt-2" />
			</div>

			{/* FLEX HORIZONTAL COM SCROLL */}
			<div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
				<div className="flex gap-3 justify-between pb-2 min-w-max">
					{stats.map((s, i) => (
						<div key={i} className="flex-shrink-0 w-[180px]">
							<StatsCard {...s} />
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
