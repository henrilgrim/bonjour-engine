
import { useEffect, useState } from "react"
import { useReasonStore } from "@/store/reasonStore"
import { useCentralNotifications } from "@/store/centralNotificationsStore"
import { useNotificationsConfig } from "@/hooks/use-notifications-config"
import { formatTime } from "../utils"

export function usePauseTimer() {
    const { correlationPause, reasons } = useReasonStore()
    const [elapsedTime, setElapsedTime] = useState(0)
    const [showTimeExceededAlert, setShowTimeExceededAlert] = useState(false)
    const [showTimeWarningAlert, setShowTimeWarningAlert] = useState(false)
    const [hasPlayedWarningSound, setHasPlayedWarningSound] = useState(false)
    const [hasPlayedExceededSound, setHasPlayedExceededSound] = useState(false)
    
    const { sendBreakExceededNotification, sendBreakWarningNotification } = useCentralNotifications()
    const { playNotificationSound, isEnabled } = useNotificationsConfig()

    // Calcular tempo decorrido
    useEffect(() => {
        const startPauseTime = correlationPause?.date_event
            ? Math.floor((Date.now() - new Date(correlationPause.date_event).getTime()) / 1000)
            : 0
        
        setElapsedTime(startPauseTime)
        
        // Reset dos flags de som quando uma nova pausa inicia
        setHasPlayedWarningSound(false)
        setHasPlayedExceededSound(false)

        const interval = setInterval(() => {
            setElapsedTime(prev => prev + 1)
        }, 1000)

        return () => clearInterval(interval)
    }, [correlationPause])

    // Dados derivados
    const currentReason = reasons.find(r => r.id === correlationPause?.type_operation?.reason)
    const pauseDuration = currentReason?.timePause || 0
    const currentPauseReason = currentReason?.name || "Pausa"
    const isTimeExceeded = pauseDuration > 0 && elapsedTime >= pauseDuration
    const timeExceededBy = isTimeExceeded ? elapsedTime - pauseDuration : 0

    // Calcular progresso da pausa
    const pauseProgressPercent = (() => {
        const started = correlationPause?.date_event ? new Date(correlationPause.date_event).getTime() : null
        const total = pauseDuration
        if (!started) return 0
        const elapsedSec = Math.max(0, Math.floor((Date.now() - started) / 1000))
        return total > 0 ? Math.min(100, (elapsedSec / total) * 100) : 0
    })()

    // Notificações e sons de tempo
    useEffect(() => {
        if (!pauseDuration || pauseDuration <= 0) return

        const warningThreshold = pauseDuration * 0.8

        // Aviso de tempo quase esgotado (80% do tempo)
        if (elapsedTime >= warningThreshold && elapsedTime < pauseDuration && !hasPlayedWarningSound) {
            console.log('Ativando aviso de tempo quase esgotado:', { elapsedTime, warningThreshold, pauseDuration })
            
            setShowTimeWarningAlert(true)
            setHasPlayedWarningSound(true)

            // Som de aviso
            if (isEnabled('pause')) {
                playNotificationSound('warning')
            }

            // Notificação PWA
            const timeRemaining = formatTime(pauseDuration - elapsedTime)
            sendBreakWarningNotification(currentPauseReason, timeRemaining)
        }
        
        // Tempo excedido
        else if (elapsedTime >= pauseDuration && !hasPlayedExceededSound) {
            console.log('Ativando aviso de tempo excedido:', { elapsedTime, pauseDuration })
            
            setShowTimeExceededAlert(true)
            setShowTimeWarningAlert(false)
            setHasPlayedExceededSound(true)

            // Som de tempo excedido
            if (isEnabled('pause')) {
                playNotificationSound('breakExceeded')
            }

            // Notificação PWA
            const timeExceededByFormatted = formatTime(elapsedTime - pauseDuration)
            sendBreakExceededNotification(currentPauseReason, timeExceededByFormatted)
        }
    }, [
        elapsedTime, 
        pauseDuration, 
        currentPauseReason, 
        hasPlayedWarningSound, 
        hasPlayedExceededSound,
        isEnabled,
        playNotificationSound,
        sendBreakExceededNotification, 
        sendBreakWarningNotification
    ])

    return {
        elapsedTime,
        pauseDuration,
        currentPauseReason,
        isTimeExceeded,
        timeExceededBy,
        pauseProgressPercent,
        showTimeExceededAlert,
        showTimeWarningAlert,
        setShowTimeExceededAlert,
        setShowTimeWarningAlert,
    }
}
