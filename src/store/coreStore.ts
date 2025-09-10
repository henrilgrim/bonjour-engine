import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CoreStore {
    isStatsVisible: boolean;
    toggleStats: () => void;
    clear: () => void;
}

export const useCoreStore = create<CoreStore>()(
    persist(
        (set) => ({
            isStatsVisible: true,
            toggleStats: () =>
                set((state) => ({ isStatsVisible: !state.isStatsVisible })),
            clear: () => {
                set({ isStatsVisible: true });
                localStorage.removeItem("core-store");
            },
        }),
        {
            name: "core-store",
            partialize: (state) => ({
                isStatsVisible: state.isStatsVisible,
            }),
        }
    )
);
