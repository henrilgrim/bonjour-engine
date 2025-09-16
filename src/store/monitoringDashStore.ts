import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { PxDash } from "@/lib/firebase/firestore/dashboard/types"

interface State {
    dashSelected?: PxDash
    setDashSelected: (dash?: PxDash) => void

    clear: () => void
}

export const useMonitoringDashStore = create<State>()(
    persist(
        (set) => ({
            dashSelected: undefined,            

            setDashSelected: (dash) => {
                const root = document.documentElement
                const isDark = dash?.thema?.startsWith("dark")
                root.classList.toggle("dark", !!isDark)
                set({ dashSelected: dash })
            },

            clear: () => set({ dashSelected: undefined }),
        }),
        {
            name: "monitoring-dash-store",
            storage: createJSONStorage(() => localStorage),
        }
    )
)