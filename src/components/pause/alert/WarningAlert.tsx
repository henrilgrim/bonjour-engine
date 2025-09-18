import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { usePauseTimer } from "../hooks/usePauseTimer"
import { formatTime } from "../utils"

interface WarningAlertProps {
    open: boolean
    onClose: () => void
    onEndPause: () => void
}

export function WarningAlert({
    open,
    onClose,
    onEndPause,
}: WarningAlertProps) {
    const {
        elapsedTime,
        pauseDuration,
        currentPauseReason,
    } = usePauseTimer()
    
    const timeRemaining = pauseDuration - elapsedTime

    return (
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                        <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <AlertDialogTitle className="text-xl font-bold text-orange-600">
                        ⚠️ Pausa Quase no Limite
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center space-y-3">
                        <div>
                            <p className="text-sm text-muted-foreground">Motivo da pausa:</p>
                            <p className="font-semibold text-lg">{currentPauseReason}</p>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Tempo previsto:</span>
                                <Badge variant="outline">{formatTime(pauseDuration)}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Tempo atual:</span>
                                <Badge variant="secondary">{formatTime(elapsedTime)}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Tempo restante:</span>
                                <Badge variant="default" className="bg-orange-500">
                                    {formatTime(timeRemaining)}
                                </Badge>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground bg-orange-50 p-3 rounded-md border border-orange-200">
                            ⏰ Sua pausa está próxima do limite de tempo. Considere finalizar em breve.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex gap-2">
                    <AlertDialogCancel onClick={onClose} className="flex-1">
                        Continuar Pausa
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onEndPause}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold"
                    >
                        🟢 Ficar Disponível
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}