import { useEffect, useState } from "react"

/**
 * Hook que recebe uma data inicial (string ou Date) e retorna
 * o tempo decorrido no formato HH:mm:ss.
 */
export function useDurationFrom(startDate?: string | Date | null) {
    const [elapsed, setElapsed] = useState("00:00:00")

    useEffect(() => {
        if (!startDate) {
            setElapsed("00:00:00")
            return
        }

        const start = new Date(startDate).getTime()
        if (isNaN(start)) {
            setElapsed("00:00:00")
            return
        }

        const update = () => {
            const diff = Date.now() - start
            const hours = Math.floor(diff / 1000 / 3600)
            const minutes = Math.floor((diff / 1000 % 3600) / 60)
            const seconds = Math.floor(diff / 1000 % 60)

            const pad = (n: number) => n.toString().padStart(2, "0")
            setElapsed(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`)
        }

        update()
        const interval = setInterval(update, 1000)
        return () => clearInterval(interval)
    }, [startDate])

    return elapsed
}
