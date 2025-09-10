import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Clock, Loader, X } from "lucide-react"
import type { WaitingApprovalProps } from "../types"

function formatElapsed(ms: number) {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`
}

export function WaitingApproval({ reasonName, startedAt, onCancel, loading, showEnterAnimation }: WaitingApprovalProps) {
    const [elapsed, setElapsed] = useState(() => formatElapsed(Date.now() - startedAt))

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(formatElapsed(Date.now() - startedAt))
        }, 1000)
        return () => clearInterval(interval)
    }, [startedAt])

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Card className={cn("shadow-lg w-80 border-orange-400 transition-all duration-500", showEnterAnimation && "scale-110")}>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="rounded-full p-4 bg-orange-100">
                            <Clock className="h-8 w-8 text-orange-600 animate-pulse" />
                        </div>

                        <div>
                            <h3 className="text-lg font-medium">AGUARDANDO APROVAÇÃO</h3>
                            <p className="text-sm mt-2">MOTIVO DA PAUSA:</p>
                            <p className="text-xl font-bold text-primary">{reasonName}</p>

                            <Badge variant="secondary" className="mt-3 animate-pulse">
                                Solicitação enviada ao supervisor
                            </Badge>

                            <div className="mt-2 p-3 rounded-md font-bold text-lg bg-orange-100 text-orange-800">
                                Aguardando há <span className="font-mono">{elapsed}</span>
                            </div>
                        </div>

                        <Button onClick={onCancel} variant="outline" className="w-full py-6 text-lg font-semibold border-red-200 hover:bg-red-50 hover:border-red-300">
                            {loading ? <Loader className="mr-2 h-5 w-5" /> : <X className="mr-2 h-5 w-5" />}
                            Cancelar Solicitação
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
