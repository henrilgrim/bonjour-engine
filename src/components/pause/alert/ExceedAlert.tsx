import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { usePauseTimer } from "../hooks/usePauseTimer";
import { formatTime } from "../utils";

interface ExceedAlertProps {
    open: boolean
    onClose: () => void
    onEndPause: () => void
}

export function ExceedAlert({
    open,
    onClose,
    onEndPause,
}: ExceedAlertProps) {
    const {
        elapsedTime,
        pauseDuration,
        currentPauseReason,
        timeExceededBy,
    } = usePauseTimer()
    return (
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <AlertDialogTitle className="text-center text-xl font-bold text-red-600">
                        ⏰ Tempo de Pausa Excedido!
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center space-y-3">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Motivo da pausa:
                            </p>
                            <p className="font-semibold text-lg">
                                {currentPauseReason}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Tempo previsto:</span>
                                <Badge variant="outline">
                                    {formatTime(pauseDuration)}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Tempo atual:</span>
                                <Badge variant="secondary">
                                    {formatTime(elapsedTime)}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">
                                    Tempo excedido:
                                </span>
                                <Badge
                                    variant="destructive"
                                    className="animate-pulse"
                                >
                                    {formatTime(timeExceededBy)}
                                </Badge>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded-md border border-yellow-200">
                            ⚠️ Por favor, finalize sua pausa para retornar ao
                            atendimento.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex gap-2">
                    <AlertDialogAction
                        onClick={onEndPause}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3"
                    >
                        🟢 Ficar Disponível Agora
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
