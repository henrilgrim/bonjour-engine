import { useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useReasonStore } from "@/store/reasonStore";

import { removePauseRequest } from "@/lib/firebase/realtime/pause/request";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { upsertProfileRequest } from "@/lib/firebase/firestore/profiles";
import { systemNotify } from "@/lib/notifications";

export function usePauseControl() {
    const { toast } = useToast();
    const store = useReasonStore();

    // Bootstrap - carrega dados e rehidrata estado
    useEffect(() => {
        (async () => {
            await store.fetchReasons();
            store.hydrateFromStorage();
        })();
    }, [store.fetchReasons, store.hydrateFromStorage]);

    const savePauseRequestToFirebase = useCallback(
        async (reasonId: string, status: "success" | "error") => {
            const { company } = useAppStore.getState();
            const { userFirebase } = useAuthStore.getState();

            if (!company?.accountcode || !userFirebase?.userId) return;

            try {
                const historyKey = `pause_request_${Date.now()}`;
                const reason = store.reasons.find((r) => r.id === reasonId);

                const pauseRequestData: any = {
                    reasonId,
                    reasonName: reason?.name || "Motivo desconhecido",
                    status, // success | error (para pausas sem aprovação)
                    timestamp: new Date().toISOString(),
                    userId: userFirebase.userId,
                    userName: userFirebase.name || "Usuário",
                };

                await upsertProfileRequest(
                    company.accountcode,
                    userFirebase.userId,
                    historyKey,
                    pauseRequestData
                );
            } catch (error) {
                console.error(
                    "Erro ao salvar histórico de pausa (Firestore):",
                    error
                );
            }
        },
        [store.reasons]
    );

    // Handlers simplificados - apenas chamam as ações do store
    const handleStartPause = useCallback(async () => {
        if (!store.selectedReason)
            return console.warn("Nenhum motivo selecionado");

        const reason = store.reasons.find((r) => r.id === store.selectedReason);

        const res = await store.startPause(store.selectedReason);

        // Só salva histórico direto para motivos sem aprovação.
        // Motivos com aprovação já são logados como "pending/approved/rejected" no reasonStore (listener).
        if (!reason?.needsApproval) {
            await savePauseRequestToFirebase(
                store.selectedReason,
                res.error ? "error" : "success"
            );
        }

        if (res.error)
            return systemNotify({
                title: "Erro ao iniciar pausa",
                message: res.message,
                variant: "error",
                type: "system",
            });
        if (res.message === "Aguardando aprovação")
            return systemNotify({
                title: "Solicitação enviada",
                message: "Aguardando aprovação do supervisor",
                variant: "info",
                type: "system",
                duration: 2000,
            });

        systemNotify({
            title: "Pausa iniciada",
            message: `Sua pausa foi iniciada com o motivo: ${reason?.name}`,
            variant: "success",
            type: "system",
        });
    }, [
        store.selectedReason,
        store.startPause,
        store.reasons,
        toast,
        savePauseRequestToFirebase,
    ]);

    const handleEndPause = useCallback(async () => {
        const corrId = store.correlationPause?._id;
        if (!corrId)
            return systemNotify({
                title: "Erro ao finalizar pausa",
                message: "Nenhuma pausa em andamento",
                variant: "error",
                type: "system",
            });

        const res = await store.endPause(corrId);
        if (res.error)
            return systemNotify({
                title: "Erro ao finalizar pausa",
                message: res.message,
                variant: "error",
                type: "system",
            });

        systemNotify({
            title: "Pausa finalizada",
            message: "Sua pausa foi finalizada com sucesso.",
            variant: "success",
            type: "system",
            duration: 2000,
        });
    }, [store.endPause, store.correlationPause, toast]);

    const handleCancelPause = useCallback(async () => {
        store.setLoadingCancel(true);

        const reasonId = store.approvalState.reasonId;
        const reasonName = store.approvalState.reasonName;

        store.setApprovalState({
            status: "canceled",
            startedAt: Date.now(),
            reasonId,
            reasonName,
        });

        store.setOpen(false);
        store.setSelectedReason("");
        await removePauseRequest(
            useAppStore.getState().company.accountcode,
            useAuthStore.getState().user.login
        ).catch((error) => {
            console.error("Erro ao cancelar requisição de pausa:", error);
        });

        // Loga "canceled" no Firestore para manter o histórico
        try {
            const { company } = useAppStore.getState();
            const { userFirebase } = useAuthStore.getState();
            const startedAt = store.approvalState.startedAt || Date.now();
            if (
                company?.accountcode &&
                userFirebase?.userId &&
                reasonId &&
                reasonName
            ) {
                const key = `pause_request_${startedAt}`;
                await upsertProfileRequest(
                    company.accountcode,
                    userFirebase.userId,
                    key,
                    {
                        status: "canceled",
                        reasonId,
                        reasonName,
                        timestamp: new Date().toISOString(),
                        userId: userFirebase.userId,
                        userName: userFirebase.name || "Usuário",
                    } as any
                );
            }
        } catch (e) {
            console.warn("Falha ao registrar cancelamento no histórico:", e);
        } finally {
            store.setLoadingCancel(false);
        }

        setTimeout(() => {
            store.clearApprovalState();
        }, 3000);
    }, [
        store.approvalState.reasonId,
        store.approvalState.reasonName,
        store.approvalState.startedAt,
        store.setApprovalState,
        store.setOpen,
        store.setSelectedReason,
        store.clearApprovalState,
    ]);

    const handleCancelWaiting = useCallback(() => {
        store.stopApprovalListener();

        store.setApprovalState({
            status: "rejected",
            startedAt: Date.now(),
            reasonId: store.approvalState.reasonId,
            reasonName: store.approvalState.reasonName,
        });

        setTimeout(() => {
            store.clearApprovalState();
        }, 3000);
    }, [
        store.stopApprovalListener,
        store.setApprovalState,
        store.clearApprovalState,
    ]);

    return {
        // Todos os estados vêm diretamente do store
        ...store,

        handleStartPause,
        handleEndPause,
        handleCancelPause,
        handleCancelWaiting,
        savePauseRequestToFirebase,
    };
}
