import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Coffee } from "lucide-react"
import { PairedPause } from "@/types"
import { cn } from "@/lib/utils"
// import { useReasonStore } from "@/store/reasonStore"

interface BreaksTableProps {
	pauses: PairedPause[]
}

export function BreaksTable({ pauses }: BreaksTableProps) {
	const [page, setPage] = useState(1)
	const limit = 10
	// const { reasons } = useReasonStore()

	const totalPages = Math.ceil(pauses.length / limit)

	const currentItems = useMemo(() => {
		const start = (page - 1) * limit
		const end = start + limit
		return pauses.slice(start, end)
	}, [page, pauses])

	const formatTime = (isoString: string) => {
		return new Date(isoString).toLocaleTimeString("pt-BR", {
			hour: "2-digit",
			minute: "2-digit",
		})
	}

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, "0")}`
	}

	return (
		<Card className={cn("guide--container-table-pauses flex flex-col overflow-hidden border-0 shadow-none", "max-h-[calc(100vh-180px)]")}>
			<CardHeader className="shrink-0 pb-4 px-6 pt-6">
				<CardTitle className="flex items-center gap-3 text-xl font-bold">
					<div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
						<Coffee className="h-5 w-5 text-primary" />
					</div>
					<span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
						Pausas do Dia
					</span>
				</CardTitle>
			</CardHeader>

			<CardContent className="flex-1 flex flex-col min-h-0 p-0">
				<div className="flex-1 overflow-y-auto nice-scroll">
					<Table className="w-full overflow-y-auto nice-scroll">
						<TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b">
							<TableRow>
								<TableHead>Motivo</TableHead>
								<TableHead className="w-20">Início</TableHead>
								<TableHead className="w-20">Fim</TableHead>
								<TableHead className="w-20">Duração</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{currentItems.length === 0 ? (
								<TableRow>
									<TableCell colSpan={7}>
										<div className="flex flex-col items-center justify-center py-14 text-muted-foreground space-y-2">
											<Coffee className="h-12 w-12 text-yellow-500 animate-pulse" />
											<p className="text-sm font-medium text-muted-foreground">Nenhuma pausa registrada hoje</p>
											<p className="text-xs text-center max-w-[250px] text-muted-foreground">
												Você ainda não iniciou nenhuma pausa. Quando fizer isso, os detalhes aparecerão aqui automaticamente.
											</p>
										</div>
									</TableCell>
								</TableRow>
							) : (
								currentItems.map((pause) => {
									return (
										<TableRow key={pause.id}>
											<TableCell className="font-medium max-w-[110px] truncate text-ellipsis overflow-hidden whitespace-nowrap" title={pause.reason}>
												{pause.reason}
											</TableCell>
											<TableCell className="font-mono text-sm">{formatTime(pause.startedAt)}</TableCell>
											<TableCell className="font-mono text-sm">{formatTime(pause.endedAt)}</TableCell>
											<TableCell className="font-mono text-sm text-green-600">
												{formatDuration(pause.durationInSeconds)}
											</TableCell>
										</TableRow>
									)
								})
							)}
						</TableBody>
					</Table>

				</div>

				{/* Paginação */}
				{totalPages > 1 && (
					<div className="shrink-0 flex items-center justify-between p-3 border-t bg-muted/20">
						<div>
							Página {page} de {totalPages} ({pauses.length} itens)
						</div>
						<div className="flex items-center gap-1">
							<Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
								<ChevronLeft className="h-3 w-3" />
							</Button>
							<Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
								<ChevronRight className="h-3 w-3" />
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
