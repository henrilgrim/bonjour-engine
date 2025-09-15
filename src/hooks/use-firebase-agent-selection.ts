import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import {
    getSelectedAgents,
    saveSelectedAgents,
    clearSelectedAgents,
} from "@/lib/firebase/firestore/profile/agents";
import { AgentProfile } from "@/lib/firebase/firestore/profile/agents/types";
import { toast } from "@/hooks/use-toast";

export function useFirebaseAgentSelection() {
    const { user } = useAuthStore();
    const [selectedAgents, setSelectedAgents] = useState<AgentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load selected agents from Firebase on mount
    useEffect(() => {
        async function loadSelectedAgents() {
            if (!user?.accountcode) return;
            
            try {
                setLoading(true);
                const agents = await getSelectedAgents(user.accountcode);
                setSelectedAgents(agents);
            } catch (error) {
                console.error("Error loading selected agents:", error);
                toast({
                    title: "Erro",
                    description: "Não foi possível carregar os agentes selecionados",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        }

        loadSelectedAgents();
    }, [user?.accountcode]);

    const saveAgents = async (agents: AgentProfile[]) => {
        if (!user?.accountcode || !user?.id) return;

        try {
            setSaving(true);
            await saveSelectedAgents(user.accountcode, user.id, agents);
            setSelectedAgents(agents);
            toast({
                title: "Sucesso",
                description: `${agents.length} agente${agents.length !== 1 ? 's' : ''} selecionado${agents.length !== 1 ? 's' : ''}`,
            });
        } catch (error) {
            console.error("Error saving selected agents:", error);
            toast({
                title: "Erro",
                description: "Não foi possível salvar a seleção de agentes",
                variant: "destructive",
            });
            throw error;
        } finally {
            setSaving(false);
        }
    };

    const clearAgents = async () => {
        if (!user?.accountcode) return;

        try {
            setSaving(true);
            await clearSelectedAgents(user.accountcode);
            setSelectedAgents([]);
            toast({
                title: "Sucesso",
                description: "Seleção de agentes removida",
            });
        } catch (error) {
            console.error("Error clearing selected agents:", error);
            toast({
                title: "Erro",
                description: "Não foi possível limpar a seleção de agentes",
                variant: "destructive",
            });
            throw error;
        } finally {
            setSaving(false);
        }
    };

    const addAgent = async (agent: AgentProfile) => {
        const newAgents = [...selectedAgents, agent];
        await saveAgents(newAgents);
    };

    const removeAgent = async (agentId: string) => {
        const newAgents = selectedAgents.filter(a => a.id !== agentId);
        await saveAgents(newAgents);
    };

    const toggleAgent = async (agent: AgentProfile) => {
        const isSelected = selectedAgents.some(a => a.id === agent.id);
        if (isSelected) {
            await removeAgent(agent.id);
        } else {
            await addAgent(agent);
        }
    };

    const isAgentSelected = (agentId: string) => {
        return selectedAgents.some(a => a.id === agentId);
    };

    return {
        selectedAgents,
        loading,
        saving,
        hasSelection: selectedAgents.length > 0,
        saveAgents,
        clearAgents,
        addAgent,
        removeAgent,
        toggleAgent,
        isAgentSelected,
    };
}