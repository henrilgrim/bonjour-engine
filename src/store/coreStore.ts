import { create } from "zustand"
import { persist } from "zustand/middleware"

interface CoreStore {
    isStatsVisible: boolean
    isStatsPinned: boolean
    isHeaderVisible: boolean // Agora controla a sidebar também
    toggleStats: () => void
    setStatsPinned: (value: boolean) => void
    toggleHeader: () => void // Agora controla a sidebar
}

export const useCoreStore = create<CoreStore>()(
    persist(
        (set) => ({
            isStatsVisible: false,
            isStatsPinned: false,
            isHeaderVisible: true,
            toggleStats: () =>
                set((state) => ({ isStatsVisible: !state.isStatsVisible })),
            setStatsPinned: (value) => set({ isStatsPinned: value }),
            toggleHeader: () =>
                set((state) => ({ isHeaderVisible: !state.isHeaderVisible })),
        }),
        {
            name: "core-store", // chave usada no localStorage
            partialize: (state) => ({
                isStatsVisible: state.isStatsVisible,
                isStatsPinned: state.isStatsPinned,
                isHeaderVisible: state.isHeaderVisible,
            }),
        }
    )
)
