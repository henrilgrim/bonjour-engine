
import { useEffect, useState, useCallback } from "react"
import { useReasonStore } from "@/store/reasonStore"
import { useNotifications } from "@/lib/notifications"
import { formatTime } from "../utils"

export function usePauseTimer() {
    const { correlationPause, reasons, pauseStartedAt } = useReasonStore()
    const [elapsedTime, setElapsedTime] = useState(0)
    const [showTimeExceededAlert, setShowTimeExceededAlert] = useState(false)
    const [showTimeWarningAlert, setShowTimeWarningAlert] = useState(false)
    const [hasPlayedWarningSound, setHasPlayedWarningSound] = useState(false)
    const [hasPlayedExceededSound, setHasPlayedExceededSound] = useState(false)
    
    const { sendBreakExceededNotification, sendBreakWarningNotification } = useNotifications()

    // Função para calcular tempo decorrido baseado no timestamp de início da pausa
    const calculateElapsedTime = useCallback(() => {
        if (!correlationPause?.date_event && !pauseStartedAt) return 0

        // Prioriza pauseStartedAt do store, senão usa date_event da correlação
        const startTime = pauseStartedAt || new Date(correlationPause.date_event).getTime()
        const now = Date.now()
        
        return Math.max(0, Math.floor((now - startTime) / 1000))
    }, [correlationPause?.date_event, pauseStartedAt])

    // Calcular tempo decorrido
    useEffect(() => {
        if (!correlationPause?.date_event && !pauseStartedAt) {
            setElapsedTime(0)
            return
        }

        // Calcula tempo inicial
        const initialElapsed = calculateElapsedTime()
        setElapsedTime(initialElapsed)
        
        // Reset dos flags de som quando uma nova pausa inicia
        setHasPlayedWarningSound(false)
        setHasPlayedExceededSound(false)

        const interval = setInterval(() => {
            const newElapsed = calculateElapsedTime()
            setElapsedTime(newElapsed)
        }, 1000)

        return () => clearInterval(interval)
    }, [correlationPause, pauseStartedAt, calculateElapsedTime])

    // Dados derivados
    const currentReason = reasons.find(r => r.id === correlationPause?.type_operation?.reason)
    const pauseDuration = currentReason?.timePause || 0
    const currentPauseReason = currentReason?.name || "Pausa"
    const isTimeExceeded = pauseDuration > 0 && elapsedTime >= pauseDuration
    const timeExceededBy = isTimeExceeded ? elapsedTime - pauseDuration : 0

    // Calcular progresso da pausa
    const pauseProgressPercent = (() => {
        if (pauseDuration <= 0) return 0
        return Math.min(100, (elapsedTime / pauseDuration) * 100)
    })()

    // Notificações e sons de tempo - usando useEffect separados para evitar loops
    useEffect(() => {
        if (!pauseDuration || pauseDuration <= 0 || hasPlayedWarningSound) return

        const warningThreshold = pauseDuration * 0.8

        // Aviso de tempo quase esgotado (80% do tempo)
        if (elapsedTime >= warningThreshold && elapsedTime < pauseDuration) {
            setShowTimeWarningAlert(true)
            setHasPlayedWarningSound(true)

            // Notificação PWA + Som
            const timeRemaining = formatTime(pauseDuration - elapsedTime)
            sendBreakWarningNotification(currentPauseReason, timeRemaining)
        }
    }, [elapsedTime, pauseDuration, hasPlayedWarningSound, currentPauseReason, sendBreakWarningNotification])

    useEffect(() => {
        if (!pauseDuration || pauseDuration <= 0 || hasPlayedExceededSound) return
        
        // Tempo excedido
        if (elapsedTime >= pauseDuration) {
            setShowTimeExceededAlert(true)
            setShowTimeWarningAlert(false)
            setHasPlayedExceededSound(true)

            // Notificação PWA + Som
            const timeExceededByFormatted = formatTime(elapsedTime - pauseDuration)
            sendBreakExceededNotification(currentPauseReason, timeExceededByFormatted)
        }
    }, [elapsedTime, pauseDuration, hasPlayedExceededSound, currentPauseReason, sendBreakExceededNotification])

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h.toString().padStart(2, "0")}:${m
            .toString()
            .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

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
        formatTime,
    }
}
