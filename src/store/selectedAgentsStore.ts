import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface SelectedAgent {
    id: string
    login: string
    fullName: string
    displayName: string
}

interface SelectedAgentsState {
    selectedAgents: SelectedAgent[]
    hasSelection: boolean
    
    addAgent: (agent: SelectedAgent) => void
    removeAgent: (agentId: string) => void
    toggleAgent: (agent: SelectedAgent) => void
    clearSelection: () => void
    setAgents: (agents: SelectedAgent[]) => void
    isAgentSelected: (agentId: string) => boolean
}

export const useSelectedAgentsStore = create<SelectedAgentsState>()(
    persist(
        (set, get) => ({
            selectedAgents: [],
            hasSelection: false,

            addAgent: (agent) => {
                set(state => {
                    const exists = state.selectedAgents.some(a => a.id === agent.id)
                    if (exists) return state
                    
                    const newAgents = [...state.selectedAgents, agent]
                    return {
                        selectedAgents: newAgents,
                        hasSelection: newAgents.length > 0
                    }
                })
            },

            removeAgent: (agentId) => {
                set(state => {
                    const newAgents = state.selectedAgents.filter(a => a.id !== agentId)
                    return {
                        selectedAgents: newAgents,
                        hasSelection: newAgents.length > 0
                    }
                })
            },

            toggleAgent: (agent) => {
                const { isAgentSelected, addAgent, removeAgent } = get()
                if (isAgentSelected(agent.id)) {
                    removeAgent(agent.id)
                } else {
                    addAgent(agent)
                }
            },

            clearSelection: () => {
                set({ selectedAgents: [], hasSelection: false })
            },

            setAgents: (agents) => {
                set({ 
                    selectedAgents: agents,
                    hasSelection: agents.length > 0
                })
            },

            isAgentSelected: (agentId) => {
                return get().selectedAgents.some(a => a.id === agentId)
            }
        }),
        {
            name: "selected-agents-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
)