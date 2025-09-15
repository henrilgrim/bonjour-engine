import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import {
    listenPauseRequestStatus,
    PauseRequest,
    respondPauseRequest,
} from "@/lib/firebase/realtime/pause/request";
import { listProfileRequests } from "@/lib/firebase/firestore/agents/profiles";
import { PauseRequestList } from "@/lib/firebase/firestore/agents/profiles/types";
import { useAuthStore } from "@/store/authStore";

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
    const nameWhoResponded = useAuthStore((s) => s.user.nome);
    const idWhoResponded = useAuthStore((s) => s.user.id);

    useEffect(() => {
        if (!agentId || !accountcode) return;

        const unsubscribe = listenPauseRequestStatus(
            accountcode,
            agentId,
            (newRequest) => {
                setRequest(newRequest);
                setLoading(false);
                setError(null);
            }
        );

        return () => unsubscribe();
    }, [agentId, accountcode]);

    const agentListRequest = async (
        id: string
    ): Promise<PauseRequestList[]> => {
        try {
            const list = await listProfileRequests(accountcode, id);
            return list;
        } catch (err) {
            console.error("Erro em agentListRequest:", err);
            return [];
        }
    };

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
