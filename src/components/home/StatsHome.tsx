import { Card, CardContent } from "@/components/ui/card"
import { useMemo } from "react"
import { Reason } from "@/types"
import { Stats } from "./utils"

interface ReasonData {
	reason: string
	durationInSeconds: number
}

interface StatsHomeProps {
	totalCalls: number
	totalBreaks?: number
	averageTime?: number
	reasons?: ReasonData[]
	allReasonsMetadata?: Reason[]
}

export function StatsHome({ totalCalls, totalBreaks = 0, averageTime = 0, reasons = [], allReasonsMetadata = [], }: StatsHomeProps) {
	const { productiveTime, unproductiveTime, mostCommonReason } = useMemo(() => {
		const grouped: Record<string, { total: number; count: number; productive: boolean }> = {}

		let prodTotal = 0
		let prodCount = 0
		let imprTotal = 0
		let imprCount = 0

		for (const pause of reasons) {
			const meta = allReasonsMetadata.find((r) => r.name === pause.reason)
			const isProductive = meta?.productivePause ?? false

			if (isProductive) {
				prodTotal += pause.durationInSeconds
				prodCount += 1
			} else {
				imprTotal += pause.durationInSeconds
				imprCount += 1
			}

			if (!grouped[pause.reason]) {
				grouped[pause.reason] = {
					total: 0,
					count: 0,
					productive: isProductive,
				}
			}

			grouped[pause.reason].total += pause.durationInSeconds
			grouped[pause.reason].count += 1
		}

		let mostUsed = Object.entries(grouped)
			.sort((a, b) => b[1].count - a[1].count)[0]?.[0] || "—"

		return {
			productiveTime: prodCount ? prodTotal / prodCount : 0,
			unproductiveTime: imprCount ? imprTotal / imprCount : 0,
			mostCommonReason: mostUsed,
		}
	}, [reasons, allReasonsMetadata])

	const stats = Stats({ totalCalls, totalBreaks, averageTime, productiveTime, unproductiveTime, mostCommonReason })

	return (
		<div className="guide--container-stats flex flex-col gap-5 h-full max-h-full overflow-hidden">
			<div className="text-center pb-2 shrink-0">
				<h3 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
					Estatísticas de Hoje
				</h3>
				<div className="w-12 h-0.5 bg-gradient-to-r from-primary to-transparent mx-auto mt-2" />
			</div>

			<div className="flex-1 overflow-y-auto nice-scroll">
				<div className="grid gap-3 pb-4">
					{stats.map((stat, index) => {
						const Icon = stat.icon
						return (
							<Card key={index} className="group shadow-none rounded-2xl bg-glass backdrop-blur-sm border border-glass-border hover:bg-surface-elevated/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-glow">
								<CardContent className="p-2">
									<div className="flex items-center gap-4">
										<div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 group-hover:border-primary/20 transition-all duration-300">
											<Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-xs text-muted-foreground font-medium truncate mb-1">
												{stat.label}
											</p>
											<p className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors duration-300">
												{stat.value}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						)
					})}
				</div>
			</div>
		</div>
	)
}
