import { useEffect, useState } from "react"
import { AlertCircle, Clock } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"
import { usePauseControl } from "@/hooks/use-pause-control"

import { useReasonStore } from "@/store/reasonStore"
import { useAppStore } from "@/store/appStore"
import { useCentralNotifications } from "@/store/centralNotificationsStore"

import { ExceedAlert, WarningAlert, WaitingApproval } from ".."

export function PauseAlert() {
    const {
        currentPauseReason,

        pauseDuration,
        timeExceededBy,

        isWaitingApproval,
        isTimeExceeded,
        showTimeExceededAnimation,
        showEnterAnimation,
        showExitAnimation,
        showTimeExceededAlert,
        showTimeWarningAlert,

        setShowTimeExceededAlert,
        setShowTimeWarningAlert,

        handleEndPause,
        handleCancelPause,
        handleCancelWaiting,
        loadingCancel
    } = usePauseControl();

    const { correlationPause, reasons, approvalState } = useReasonStore();
    const { actualStateExtension } = useAppStore();
    const [elapsedTime, setElapsedTime] = useState(0);
    const { sendBreakExceededNotification, sendBreakWarningNotification } = useCentralNotifications();

    useEffect(() => {
        const startPauseTime = correlationPause?.date_event ? Math.floor((Date.now() - new Date(correlationPause.date_event).getTime()) / 1000) : 0;
        setElapsedTime(startPauseTime);

        const interval = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [correlationPause]);

    useEffect(() => {
        if (elapsedTime >= pauseDuration && pauseDuration > 0) {
            setShowTimeExceededAlert(true);
            setShowTimeWarningAlert(false);
            
            // Send PWA notification for exceeded time only once
            const timeExceededBy = formatTime(elapsedTime - pauseDuration);
            sendBreakExceededNotification(currentPauseReason, timeExceededBy);
        } else if (elapsedTime >= pauseDuration * 0.8 && pauseDuration > 0 && elapsedTime < pauseDuration) {
            setShowTimeWarningAlert(true);
            
            // Send PWA notification for warning only once
            const timeRemaining = formatTime(pauseDuration - elapsedTime);
            sendBreakWarningNotification(currentPauseReason, timeRemaining);
        }
    }, [elapsedTime, pauseDuration]);

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600)
        const m = Math.floor((sec % 3600) / 60)
        const s = sec % 60
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    }

    if (isWaitingApproval && handleCancelWaiting) {
        return (
            <WaitingApproval
                reasonName={approvalState.reasonName}
                startedAt={approvalState.startedAt}
                onCancel={handleCancelPause}
                loading={loadingCancel}
                showEnterAnimation={showEnterAnimation}
            />
        )
    }

    const pauseProgressPercent = (() => {
        const started = correlationPause?.date_event ? new Date(correlationPause.date_event).getTime() : null
        const reason = reasons.find(r => r.id === correlationPause?.type_operation?.reason);
        const total = reason?.timePause || 0
        if (!started) return 0
        const elapsedSec = Math.max(0, Math.floor((Date.now() - started) / 1000))
        return total > 0 ? Math.min(100, (elapsedSec / total) * 100) : 0
    })()

    const hasTimeLimit = pauseDuration > 0
    const releasedToPause = actualStateExtension.status.includes("OK")

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <Card className={cn("shadow-lg w-80 transition-all duration-500", isTimeExceeded ? "border-red-500" : "border-yellow-400", showEnterAnimation && "scale-110", showExitAnimation && "scale-0 opacity-0", showTimeExceededAnimation && "animate-pulse")}>
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className={cn("rounded-full p-4 transition-colors duration-300", isTimeExceeded ? "bg-red-100" : "bg-yellow-100", showTimeExceededAnimation && "animate-bounce")}>
                                <Clock className={cn("h-8 w-8", isTimeExceeded ? "text-red-600" : "text-yellow-600")} />
                            </div>

                            <div>
                                <h3 className="text-lg font-medium">SEU STATUS ATUAL</h3>
                                <p className="text-sm mt-2">MOTIVO DA PAUSA:</p>
                                <p className="text-xl font-bold text-primary">{currentPauseReason}</p>

                                {hasTimeLimit && (
                                    <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div
                                            className={cn(
                                                "h-2.5 rounded-full transition-all duration-300",
                                                isTimeExceeded
                                                    ? "bg-red-500"
                                                    : pauseProgressPercent > 80
                                                        ? "bg-orange-400"
                                                        : "bg-green-500"
                                            )}
                                            style={{ width: `${Math.min(100, pauseProgressPercent)}%` }}
                                        />
                                    </div>
                                )}

                                <div
                                    className={cn(
                                        "mt-2 p-3 rounded-md font-bold text-2xl",
                                        isTimeExceeded ? "bg-red-500 text-white" : "bg-yellow-400 text-black",
                                        showTimeExceededAnimation && "animate-pulse"
                                    )}
                                >
                                    {formatTime(elapsedTime)}{" "}
                                    {hasTimeLimit ? `/ ${formatTime(pauseDuration)}` : ""}
                                </div>

                                {isTimeExceeded && (
                                    <Badge variant="destructive" className="mt-2 animate-bounce">
                                        <AlertCircle className="mr-1 h-3 w-3" />
                                        Tempo excedido!
                                    </Badge>
                                )}

                                {!releasedToPause && (
                                    <Badge variant="destructive" className="mt-2">
                                        <AlertCircle className="mr-1 h-3 w-3" />
                                        Ramal indisponível
                                    </Badge>
                                )}
                            </div>

                            <Button
                                onClick={handleEndPause}
                                disabled={!releasedToPause}
                                className={cn(
                                    "w-full py-6 text-lg font-semibold transition-colors duration-300",
                                    !releasedToPause
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : isTimeExceeded
                                            ? "bg-red-500 hover:bg-red-600"
                                            : "bg-green-500 hover:bg-green-600"
                                )}
                            >
                                Ficar Disponível
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <ExceedAlert
                open={showTimeExceededAlert}
                onClose={() => setShowTimeExceededAlert(false)}
                currentPauseReason={currentPauseReason}
                pauseTime={elapsedTime}
                pauseDuration={pauseDuration}
                timeExceededBy={timeExceededBy}
                handleEndPause={handleEndPause}
                formatTime={formatTime}
            />

            <WarningAlert
                open={showTimeWarningAlert}
                onClose={() => setShowTimeWarningAlert(false)}
                currentPauseReason={currentPauseReason}
                pauseTime={elapsedTime}
                pauseDuration={pauseDuration}
                handleEndPause={handleEndPause}
                formatTime={formatTime}
            />
        </>
    )
}
