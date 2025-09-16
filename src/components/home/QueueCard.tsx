import { useMemo, useState } from "react"
import { Users, Headphones, Clock, Timer, PhoneMissed, PhoneIncoming, User, PauseCircle, UsersRound } from "lucide-react"
import type { PxFila } from "@/lib/repos/monitoring-dash-repo"
import QueueConfigDialog from "./queue/QueueConfigDialog"
import { TransformedQueue } from "@/utils/transform-queue-monitoting"
import QueueInfoDialog from "./queue/QueueInfoDialog"

interface QueueCardProps {
	name: string
	totalAgents: number
	activeAgents: number
	queueSize: number
	filaData: TransformedQueue
	onSaveConfig: (filaId: string, config: PxFila["configuracao"]) => void
}

type QueueLevel = "ok" | "warn" | "crit"

const hsl = (token: string, alpha?: number) => alpha !== undefined ? `hsl(var(--${token}) / ${alpha})` : `hsl(var(--${token}))`
function toNum(v: unknown, def: number) { const n = Number(v); return Number.isFinite(n) ? n : def; }
function clamp(n: number, min: number, max: number) { return Math.min(max, Math.max(min, n)) }

/**
 * Mesma regra do semáforo global:
 * - Verde: pct < alerta
 * - Amarelo: alerta ≤ pct < crítico
 * - Vermelho: pct ≥ crítico
 * Defaults: alerta=70, critico=100
 */
function getQueueLevelFromConfig(totalAgents: number, busyAgents: number, estados?: { alerta?: string; critico?: string }): QueueLevel {
	let alerta = toNum(estados?.alerta, 70)
	let critico = toNum(estados?.critico, 100)

	// Garantias: 0 ≤ alerta < crítico ≤ 100
	alerta = clamp(alerta, 0, 99)   // deixa espaço para o crítico
	critico = clamp(critico, 1, 100)
	if (critico <= alerta) critico = Math.min(100, alerta + 1)

	if (totalAgents <= 0) return "ok"

	const pct = (busyAgents / totalAgents) * 100
	if (pct >= critico) return "crit"
	if (pct >= alerta) return "warn"
	return "ok"
}

export default function QueueCard({ name, totalAgents, activeAgents, filaData, onSaveConfig }: QueueCardProps) {
	const [openInfoDialog, setOpenInfoDialog] = useState(false)
	const [statusInfoDialog, setStatusInfoDialog] = useState<string>("")
	const isEmpty = totalAgents === 0
	const occupiedAgents = Math.max(0, totalAgents - activeAgents)

	const occupiedPct = useMemo(
		() => (totalAgents > 0 ? (occupiedAgents / totalAgents) * 100 : 0),
		[occupiedAgents, totalAgents]
	)

	const level: QueueLevel = useMemo(
		() =>
			getQueueLevelFromConfig(
				totalAgents,
				occupiedAgents,
				filaData.configuracao?.estados
			),
		[totalAgents, occupiedAgents, filaData.configuracao?.estados]
	)

	const levelToken = { ok: "traffic-green", warn: "warning", crit: "destructive" }[level]
	const showPulse = level === "crit" && !isEmpty

	const statusCount = useMemo(() => {
		const counts: Record<string, number> = {
			disponivel: 0,
			ocupado: 0,
			emEspera: 0,
			pausa: 0
		}

		filaData.queueMemberStatus?.forEach(({ status, agentes }) => {
			switch (status) {
				case "1":
					counts.disponivel += agentes.length
					break
				case "2":
				case "3":
				case "6":
				case "7":
					counts.ocupado += agentes.length
					break
				case "8":
					counts.emEspera += agentes.length
					break
				case "999":
					counts.pausa += agentes.length
					break
			}
		})

		return counts
	}, [filaData.queueMemberStatus])

	const openInfoDialogStatus = (status: string) => {
		setStatusInfoDialog(status)
		setOpenInfoDialog(true)
	}

	return (
		<div
			className={`bg-card rounded-lg p-4 border flex flex-col h-full transition ${showPulse ? "ring-2 ring-destructive/30 animate-pulse" : "hover:shadow-md shadow-sm"
				}`}
			style={{ borderColor: hsl("border") }}
		>
			{/* Header */}
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-sm lg:text-base font-semibold text-foreground flex items-center gap-2 truncate">
					<Headphones className="w-4 h-4 text-foreground" />
					<span className="truncate">{name}</span>
				</h3>

				<div className="flex items-center gap-1">
					<Users className="w-3 h-3 text-muted-foreground" />
					<span className="text-xs text-muted-foreground">
						{occupiedAgents}/{totalAgents}
					</span>

					<QueueConfigDialog fila={filaData} filaNome={name} onSave={onSaveConfig} />
				</div>
			</div>

			{/* Totalizadores */}
			<div className="grid grid-cols-2 gap-2 text-center text-xs mb-4">
				<div className="bg-muted rounded-lg p-2">
					<PhoneIncoming className="w-4 h-4 mx-auto" />
					<div className="text-muted-foreground">Atend.</div>
					<div className="font-semibold">{filaData.totalizadores?.recebidasAtendidas}</div>
				</div>

				<div className="bg-muted rounded-lg p-2">
					<PhoneMissed className="w-4 h-4 mx-auto" />
					<div className="text-muted-foreground">Aband.</div>
					<div className="font-semibold">{filaData.totalizadores?.recebidasAbandonadas}</div>
				</div>

				<div className="bg-muted rounded-lg p-2">
					<Clock className="w-4 h-4 mx-auto" />
					<div className="text-muted-foreground">TMA</div>
					<div className="font-semibold">
						{filaData.totalizadores?.mediaTMA.toFixed(1)}s
					</div>
				</div>

				<div className="bg-muted rounded-lg p-2">
					<Timer className="w-4 h-4 mx-auto" />
					<div className="text-muted-foreground">TME</div>
					<div className="font-semibold">
						{filaData.totalizadores?.mediaTME.toFixed(1)}s
					</div>
				</div>
			</div>

			{/* Barra de ocupação */}
			<div className="mb-4">
				<div className="flex justify-between text-xs mb-1">
					<span className="text-muted-foreground">Agentes Indisponíveis (Ocupados, Em Pausa ou Em Espera)</span>
					<span className="font-bold" style={{ color: "black" }}>
						{isEmpty ? "0%" : `${Math.round(occupiedPct)}%`}
					</span>
				</div>
				<div className="w-full rounded-full h-3 bg-muted overflow-hidden">
					{!isEmpty && (
						<div
							className="h-full transition-all duration-500 relative"
							style={{
								width: `${occupiedPct}%`,
								backgroundColor: hsl(levelToken)
							}}
						>
							<div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 pointer-events-none" />
						</div>
					)}
				</div>
			</div>

			{/* Status dos agentes */}
			<div
				className="grid grid-cols-4 gap-2 text-center mt-auto pt-3 border-t"
				style={{ borderColor: hsl("border") }}
			>
				<div
					role="button"
					tabIndex={0}
					className="text-xs cursor-pointer rounded-md p-1 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring"
					onClick={() => openInfoDialogStatus('disponivel')}
					onKeyDown={(e) => e.key === 'Enter' && openInfoDialogStatus('disponivel')}
				>
					<User className="mx-auto h-4 w-4 text-green-600" />
					<div>Disp.</div>
					<div className="font-medium">{statusCount.disponivel}</div>
				</div>
				<div
					role="button"
					tabIndex={0}
					className="text-xs cursor-pointer rounded-md p-1 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring"
					onClick={() => openInfoDialogStatus('ocupado')}
					onKeyDown={(e) => e.key === 'Enter' && openInfoDialogStatus('ocupado')}
				>
					<Headphones className="mx-auto h-4 w-4 text-yellow-600" />
					<div>Ocup.</div>
					<div className="font-medium">{statusCount.ocupado}</div>
				</div>

				<div
					role="button"
					tabIndex={0}
					className="text-xs cursor-pointer rounded-md p-1 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring"
					onClick={() => openInfoDialogStatus('pausa')}
					onKeyDown={(e) => e.key === 'Enter' && openInfoDialogStatus('pausa')}
				>
					<PauseCircle className="mx-auto h-4 w-4 text-blue-600" />
					<div>Pausa</div>
					<div className="font-medium">{statusCount.pausa}</div>
				</div>

				<div
					role="button"
					tabIndex={0}
					className="text-xs cursor-pointer rounded-md p-1 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring"
					onClick={() => openInfoDialogStatus('emEspera')}
					onKeyDown={(e) => e.key === 'Enter' && openInfoDialogStatus('emEspera')}
				>
					<UsersRound className="mx-auto h-4 w-4 text-orange-600" />
					<div>Espera</div>
					<div className="font-medium">{statusCount.emEspera}</div>
				</div>
			</div>

			{openInfoDialog && (
				<QueueInfoDialog open={openInfoDialog} setOpen={setOpenInfoDialog} filaData={filaData} status={statusInfoDialog} />
			)}
		</div>
	)
}
