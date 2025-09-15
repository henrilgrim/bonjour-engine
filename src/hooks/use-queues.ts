import { useEffect, useRef } from "react"
import { useQueuesStore } from "@/store/queuesStore"
import { useAuthStore } from "@/store/authStore"

export function useQueues(auto = true) {
    // seletores isolados evitam o objeto 'unknown' e re-renders desnecessários
    const items = useQueuesStore((s) => s.items)
    const loading = useQueuesStore((s) => s.loading)
    const error = useQueuesStore((s) => s.error)
    const fetchAll = useQueuesStore((s) => s.fetchAll)

    const token = useAuthStore((s) => s.user?.token_service)

    // evita refetch com o mesmo token
    const fetchedRef = useRef<string | null>(null)

    useEffect(() => {
        if (!auto) return
        if (!token) return

        const needsFetch = fetchedRef.current !== token || items.length === 0

        if (needsFetch) {
            fetchedRef.current = token
            fetchAll(token)
        }
    }, [auto, token, items.length, fetchAll]) // ← dependências corretas

    return {
        items,
        loading,
        error,
        refetch: () => { if (token) fetchAll(token) }
    }
}
