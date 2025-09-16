import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { PxDash } from "@/lib/firebase/firestore/dashboard/types"
import { useQueues } from "@/hooks/use-queues"
import { Pencil, Trash } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { useState } from "react"
import SelectDashDialog from "@/components/select-dash/SelectDashDialog"

type Props = {
    dash: PxDash
    onSelect: (dash: PxDash) => void
    onDelete: (dash: PxDash) => void
}

export default function DashboardCard({ dash, onSelect, onDelete }: Props) {
    const filasCount = dash.filas?.length ?? 0
    const { loading: loadingQueues, items: queuesItems } = useQueues()
    const [showCreate, setShowCreate] = useState(false)

    return (
        <Card className="border bg-card/60 backdrop-blur-sm hover:shadow-lg transition">
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg text-card-foreground">{dash.nome}</CardTitle>

                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className="ml-2 text-red-500 hover:text-red-700"
                                    onClick={() => onDelete(dash)}
                                    aria-label="Apagar dashboard"
                                >
                                    <Trash className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Apagar dashboard</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className="ml-2 text-blue-500 hover:text-blue-700"
                                    onClick={() => setShowCreate(true)}
                                    aria-label="Editar dashboard"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Editar dashboard</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {dash.descricao && (
                    <p className="text-sm text-muted-foreground">{dash.descricao}</p>
                )}
            </CardHeader>

            <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Filas</span>
                    <span className="font-medium text-card-foreground">{filasCount}</span>
                </div>

                {dash.configuracao?.estados && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                        {(["alerta", "critico"] as const).map((nivel) => (
                            <div key={nivel} className="rounded-md border p-2">
                                <div className="text-xs text-muted-foreground capitalize">{nivel}</div>
                                <div className="font-semibold text-card-foreground">
                                    {dash.configuracao?.estados?.[nivel]}%
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button className="w-full sm:w-auto flex-1" onClick={() => onSelect(dash)}>
                    Usar este dashboard
                </Button>
            </CardFooter>

            {showCreate && (
                <SelectDashDialog
                    mode="edit"
                    accountcode={dash.accountcode}
                    queues={queuesItems}
                    queuesLoading={loadingQueues}
                    initialDash={dash}
                    open={true}
                    onOpenChange={(v) => { if (!v) setShowCreate(false) }}
                />
            )}
        </Card>
    )
}
