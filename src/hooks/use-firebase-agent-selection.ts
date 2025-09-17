import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import {
    listProfileAgents,
    upsertProfileAgent,
    deleteProfileAgent,
} from "@/lib/firebase/firestore/profile";
import type { ProfileAgent } from "@/lib/firebase/firestore/profile/types";
import { toast } from "@/hooks/use-toast";

export function useFirebaseAgentSelection() {
    const { user } = useAuthStore();
    const [selectedAgents, setSelectedAgents] = useState<ProfileAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load selected agents from Firebase on mount
    useEffect(() => {
        async function loadSelectedAgents() {
            if (!user?.accountcode || !user?.id) return;
            
            try {
                setLoading(true);
                const agents = await listProfileAgents(user.accountcode, user.id);
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
    }, [user?.accountcode, user?.id]);

    const saveAgents = async (agents: ProfileAgent[]) => {
        if (!user?.accountcode || !user?.id) return;

        try {
            setSaving(true);
            
            // First, delete all existing agents
            for (const existingAgent of selectedAgents) {
                await deleteProfileAgent(user.accountcode, user.id, existingAgent.id);
            }
            
            // Then, save the new selected agents
            for (const agent of agents) {
                await upsertProfileAgent(user.accountcode, user.id, agent.id, {
                    login: agent.login,
                    fullName: agent.fullName,
                    displayName: agent.displayName,
                });
            }
            
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
        if (!user?.accountcode || !user?.id) return;

        try {
            setSaving(true);
            // Delete all agents for this profile
            for (const agent of selectedAgents) {
                await deleteProfileAgent(user.accountcode, user.id, agent.id);
            }
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

    const addAgent = async (agent: ProfileAgent) => {
        if (!user?.accountcode || !user?.id) return;
        
        try {
            await upsertProfileAgent(user.accountcode, user.id, agent.id, {
                login: agent.login,
                fullName: agent.fullName,
                displayName: agent.displayName,
            });
            setSelectedAgents(prev => [...prev, agent]);
        } catch (error) {
            console.error("Error adding agent:", error);
            throw error;
        }
    };

    const removeAgent = async (agentId: string) => {
        if (!user?.accountcode || !user?.id) return;
        
        try {
            await deleteProfileAgent(user.accountcode, user.id, agentId);
            setSelectedAgents(prev => prev.filter(a => a.id !== agentId));
        } catch (error) {
            console.error("Error removing agent:", error);
            throw error;
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
        isAgentSelected,
    };
}