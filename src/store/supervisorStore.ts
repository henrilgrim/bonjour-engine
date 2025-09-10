import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import type { SupervisorOnline } from "@/hooks/use-firebase-supervisors";

interface SupervisorState {
    supervisors: Record<string, SupervisorOnline>;
    lastSeen: Record<string, number>;
    isListening: boolean;
}

interface SupervisorActions {
    setSupervisor: (supervisor: SupervisorOnline) => void;
    removeSupervisor: (supervisorId: string) => void;
    markSupervisorOffline: (supervisorId: string) => void;
    updateLastSeen: (supervisorId: string, timestamp: number) => void;
    setListening: (listening: boolean) => void;
    getSupervisorsList: () => SupervisorOnline[];
    getSupervisorById: (id: string) => SupervisorOnline | undefined;
    clearAllSupervisors: () => void;
    clear: () => void;
}

type SupervisorStore = SupervisorState & SupervisorActions;

export const useSupervisorStore = create<SupervisorStore>()(
    persist(
        (set, get) => ({
            // State
            supervisors: {},
            lastSeen: {},
            isListening: false,

            // Actions
            setSupervisor: (supervisor) => {
                const now = Date.now();
                set((state) => ({
                    supervisors: {
                        ...state.supervisors,
                        [supervisor.id]: { ...supervisor, status: "logged" },
                    },
                    lastSeen: { ...state.lastSeen, [supervisor.id]: now },
                }));
            },

            removeSupervisor: (supervisorId) => {
                set((state) => {
                    const { [supervisorId]: removed, ...supervisors } =
                        state.supervisors;
                    const { [supervisorId]: removedLastSeen, ...lastSeen } =
                        state.lastSeen;
                    return { supervisors, lastSeen };
                });
            },

            markSupervisorOffline: (supervisorId) => {
                set((state) => {
                    if (!state.supervisors[supervisorId]) return state;

                    return {
                        supervisors: {
                            ...state.supervisors,
                            [supervisorId]: {
                                ...state.supervisors[supervisorId],
                                status: "offline",
                            },
                        },
                    };
                });
            },

            updateLastSeen: (supervisorId, timestamp) => {
                set((state) => ({
                    lastSeen: {
                        ...state.lastSeen,
                        [supervisorId]: timestamp,
                    },
                }));
            },

            setListening: (listening) => {
                set({ isListening: listening });
            },

            getSupervisorsList: () => {
                return Object.values(get().supervisors);
            },

            getSupervisorById: (id) => {
                return get().supervisors[id];
            },

            clearAllSupervisors: () => {
                set({ supervisors: {}, lastSeen: {} });
            },

            clear: () => {
                set({ supervisors: {}, lastSeen: {}, isListening: false });
                localStorage.removeItem("supervisor-storage");
            },
        }),
        {
            name: "supervisor-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                supervisors: state.supervisors,
                lastSeen: state.lastSeen,
                isListening: state.isListening,
            }),
        }
    )
);
