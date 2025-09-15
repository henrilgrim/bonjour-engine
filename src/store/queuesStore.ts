import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getApiService } from "@/lib/api/services"

export type QueueItem = {
    id: string
    name: string
    department: string
    strategy: string
}

interface State {
    items: QueueItem[]
    loading: boolean
    error: string | null
    fetchAll: (token: string) => Promise<void>

    clear: () => void
}

export const useQueuesStore = create<State>()(
    persist(
        (set) => ({
            items: [],
            loading: false,
            error: null,

            fetchAll: async (token: string) => {
                set({ loading: true, error: null })
                try {
                    const { data, status } = await getApiService('pxtalkV1', 'private', token).get("/queues")
                    if (status !== 200 || data?.error) throw new Error(data?.message || `Falha ao buscar filas (status ${status})`)

                    const raw: any[] = Array.isArray(data) ? data : []
                    const items: QueueItem[] = raw.map((f) => ({ id: f._id, name: f.key['queue-name'], department: f.departament, strategy: f.strategy }))

                    set({ items, loading: false })
                } catch (e: any) {
                    const msg = e?.response?.data?.message || e?.message || "Erro ao buscar filas"
                    set({ error: String(msg), loading: false })
                }
            },

            clear: () => set({ items: [], loading: false, error: null }),
        }),
        {
            name: "queues-store", // nome da chave no localStorage
            partialize: (state) => ({ items: state.items }), // opcional: salva apenas o que for necessário
        }
    )
)
