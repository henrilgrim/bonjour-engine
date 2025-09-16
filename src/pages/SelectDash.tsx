import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { useMonitoringDashStore } from "@/store/monitoringDashStore"
import { useDashboards } from "@/hooks/use-dashboards"
import { Input } from "@/components/ui/input"
import { Loader2, Search, FolderOpen } from "lucide-react"
import { useQueuesStore } from "@/store/queuesStore"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { useState } from "react"

import SelectDashDialog from "@/components/select-dash/SelectDashDialog"
import SelectDashCard from "@/components/select-dash/SelectDashCard"
import { PxDash } from "@/lib/firebase/firestore/dashboard/types"

export default function SelectDashPage() {
	const navigate = useNavigate()
	const { user } = useAuthStore()
	const setDashSelected = useMonitoringDashStore((s) => s.setDashSelected)
	const items = useQueuesStore((s) => s.items)
	const loadingQueues = useQueuesStore((s) => s.loading)
	const errorQueues = useQueuesStore((s) => s.error)
	const fetchAllQueues = useQueuesStore((s) => s.fetchAll)
	const { toast } = useToast()

	const fetchedRef = useRef<string | null>(null)
	const [showCreate, setShowCreate] = useState(false)

	useEffect(() => {
		const shouldFetch = fetchedRef.current !== user?.token_pxtalk || items.length === 0

		if (shouldFetch) {
			fetchedRef.current = user?.token_service
			fetchAllQueues(user?.token_service)
		}
	}, [user?.token_pxtalk, items.length, fetchAllQueues])

	useEffect(() => {
		if (errorQueues) {
			toast({ variant: "destructive", title: "Erro", description: `Erro ao carregar filas: ${errorQueues}` })
		}
	}, [errorQueues])

	if (!user) {
		navigate("/login", { replace: true })
		return null
	}

	const { loading, filtered, search, setSearch, refresh, deleteDashboard } = useDashboards({ accountcode: user.accountcode })

	const handleSelect = (dash: any) => {
		setDashSelected(dash)
		navigate("/home", { replace: true })
	}

	const handleDelete = async (dash: PxDash) => {
		if (!dash.id) {
			toast({ variant: "destructive", title: "Erro", description: "Dashboard inválido." })
			return
		}

		if (confirm(`Tem certeza que deseja excluir o dashboard "${dash.nome}"?`)) {
			try {
				await deleteDashboard(dash.accountcode, dash.id)
				toast({ variant: "success", title: "Sucesso", description: "Dashboard excluído com sucesso!" })
				refresh()
			} catch (error) {
				console.error("Erro ao excluir dashboard:", error)
				toast({ variant: "destructive", title: "Erro", description: "Erro ao excluir dashboard. Tente novamente." })
			}
		}
	}

	return (
		<>
			<div className="mb-6 flex items-center justify-between gap-4">
				<div className="relative w-full max-w-sm">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Buscar por nome ou descrição" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
				</div>

				<Button className="whitespace-nowrap" onClick={() => setShowCreate(true)}>
					Criar dashboard
				</Button>
			</div>

			{loading ? (
				<div className="flex h-40 items-center justify-center">
					<Loader2 className="h-6 w-6 animate-spin" />
				</div>
			) : filtered.length === 0 ? (
				<div className="flex flex-col flex-1 items-center justify-center">
					<div className="flex flex-1 flex-col items-center justify-center text-center py-16">
						<FolderOpen className="w-20 h-20 text-muted-foreground mb-4" />
						<p className="text-muted-foreground mb-4">
							Nenhum dashboard encontrado.
						</p>

						<Button className="whitespace-nowrap" onClick={() => setShowCreate(true)}>
							Criar dashboard
						</Button>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
					{filtered.map((dash) => (
						<SelectDashCard
							key={dash.id}
							dash={dash}
							onSelect={handleSelect}
							onDelete={handleDelete}
						/>
					))}
				</div>
			)}

			{showCreate && (
				<SelectDashDialog
					mode="create"
					accountcode={user.accountcode}
					queues={items}
					queuesLoading={loadingQueues}
					open={true}
					onOpenChange={(v) => { if (!v) setShowCreate(false) }}
					onCreated={() => {
						toast({ variant: "success", title: "Sucesso", description: "Dashboard criado!" })
						setShowCreate(false)
						refresh()
					}}
				/>
			)}
		</>
	)
}
