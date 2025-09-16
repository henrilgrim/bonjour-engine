import { useEffect, useMemo, useState } from "react"
import { useAuthStore } from "@/store/authStore"
import { PxDash } from "@/lib/firebase/firestore/dashboard/types"
import { deleteDashboard, subscribeDashboards } from "@/lib/firebase/firestore/dashboard"

type UseDashboardsOpts = { accountcode: string }

export function useDashboards({ accountcode }: UseDashboardsOpts) {
    const user = useAuthStore(state => state.user)
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState<PxDash[]>([])
    const [search, setSearch] = useState("")
    const [version, setVersion] = useState(0)

    const refresh = () => setVersion(v => v + 1)

    useEffect(() => {
        if (!accountcode) return

        setLoading(true)

        const unsub = subscribeDashboards(accountcode, { accountcode, userId: user?.id }, (data) => {
            setItems(data)
            setLoading(false)
        }, (err) => {
            console.error("subscribeDashboards error:", err)
            setItems([])
            setLoading(false)
        })

        return () => unsub()
    }, [accountcode, user?.id, version])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return items
        return items.filter((d) => [d.nome, d.descricao, d.accountcode].some((v) => v?.toLowerCase().includes(q)))
    }, [items, search])

    return {
        loading,
        items,
        filtered,
        search,
        setSearch,
        refresh,
        deleteDashboard
    }
}
