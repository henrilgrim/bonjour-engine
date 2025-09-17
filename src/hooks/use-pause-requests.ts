import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import {
    PauseRequest,
    respondPauseRequest,
} from "@/lib/firebase/realtime/pause/request";
import { useOptimizedPauseRequests } from "@/lib/firebase/optimized-listeners";
import type { PauseRequestList } from "@/lib/firebase/firestore/agents/types";
import { useAuthStore } from "@/store/authStore";
import { listProfileRequests } from "@/lib/firebase/firestore/agents";

interface UsePauseRequestsOptions {
    agentId: string;
    accountcode: string;
}

export function usePauseRequests({
    agentId,
    accountcode,
}: UsePauseRequestsOptions) {
    const [request, setRequest] = useState<PauseRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const user = useAuthStore((s) => s.user);

    // Valores seguros para evitar undefined
    const nameWhoResponded = user?.nome || "";
    const idWhoResponded = user?.id || "";

    useEffect(() => {
        if (!agentId || !accountcode) {
            console.warn(
                "usePauseRequests: agentId ou accountcode está vazio",
                { agentId, accountcode }
            );
            setLoading(false);
            return;
        }

        const unsubscribe = useOptimizedPauseRequests(
            accountcode,
            agentId,
            (newRequest) => {
                setRequest(newRequest);
                setLoading(false);
                setError(null);
            },
            (error) => {
                console.error("Erro ao escutar solicitações de pausa:", error);
                setError(String(error));
                setLoading(false);
            }
        );

        return () => {
            unsubscribe();
        };
    }, [agentId, accountcode]);

    const agentListRequest = useCallback(
        async (id?: string): Promise<PauseRequestList[]> => {
            try {
                if (!id) {
                    console.warn("agentListRequest chamado sem ID válido");
                    return [];
                }
                const res = await listProfileRequests(accountcode, id);
                return res;
            } catch (err) {
                console.error("Erro em agentListRequest:", err);
                return [];
            }
        },
        []
    );

    const approveRequest = async () => {
        try {
            await respondPauseRequest(
                accountcode,
                agentId,
                {
                    status: "approved",
                },
                nameWhoResponded,
                idWhoResponded
            );
        } catch (err) {
            console.error("Erro ao aprovar solicitação:", err);
            toast({
                title: "Erro",
                description: "Não foi possível aprovar a solicitação",
                variant: "destructive",
            });
        }
    };

    const rejectRequest = async (rejectionReason?: string) => {
        try {
            await respondPauseRequest(
                accountcode,
                agentId,
                {
                    status: "rejected",
                    rejectionReason,
                },
                nameWhoResponded,
                idWhoResponded
            );
        } catch (err) {
            console.error("Erro ao rejeitar solicitação:", err);
            toast({
                title: "Erro",
                description: "Não foi possível rejeitar a solicitação",
                variant: "destructive",
            });
        }
    };

    return {
        request,
        loading,
        error,
        approveRequest,
        rejectRequest,
        agentListRequest, // agora está disponível
    };
}
