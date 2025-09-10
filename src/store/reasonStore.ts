import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getApiService } from "@/lib/api/services";
import handleReasons from "@/utils/handleReasons";
import type { Reason, AgentOperation } from "@/types";
import { changeStatusAgent } from "@/lib/firebase/realtime/online";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import {
    sendPauseRequest,
    listenPauseRequestStatus,
    removePauseRequest,
} from "@/lib/firebase/realtime/pause/request";
import { toMs } from "@/types/reason-store";
import { upsertProfileRequest } from "@/lib/firebase/firestore/profiles";
import { systemNotify } from "./centralNotificationsStore";

type PauseResponse<T> = { data: T | null; error: boolean; message: string };
type ListenerStop = () => void;

type ApprovalState = {
    status: "waiting" | "approved" | "rejected" | "canceled" | null;
    startedAt: number | null;
    reasonId: string | null;
    reasonName: string | null;
};

interface ReasonState {
    // data
    reasons: Reason[];

    // flags
    loading: boolean;
    loadingCancel: boolean;
    fetching: boolean;
    starting: boolean;
    ending: boolean;
    error: string | null;
    hasFetched: boolean;

    // pause state
    in_pause: boolean;
    correlationPause: AgentOperation;
    pauseStartedAt: number | null;
    pauseDurationSeconds: number | null;

    // approval state (substituindo localStorage)
    approvalState: ApprovalState;

    // UI states
    isPaused: boolean;
    isWaitingApproval: boolean;
    selectedReason: string;
    open: boolean;
    pauseTime: number;
    pauseDuration: number;
    isTimeExceeded: boolean;
    pauseProgressPercent: number;
    progress: number;
    timeExceededBy: number;
    showTimeExceededAnimation: boolean;
    showEnterAnimation: boolean;
    showExitAnimation: boolean;
    showTimeExceededAlert: boolean;
    showTimeWarningAlert: boolean;
    currentPauseReason: string;

    // internal refs
    approvalListener: ListenerStop | null;
    timeInterval: ReturnType<typeof setInterval> | null;

    // setters
    setInPause: (inPause: boolean) => void;
    setCorrelationPause: (correlation: AgentOperation) => void;
    setReasons: (reasons: Reason[]) => void;
    setIsWaitingApproval: (waiting: boolean) => void;
    setSelectedReason: (reasonId: string) => void;
    setOpen: (open: boolean) => void;
    setShowTimeExceededAlert: (show: boolean) => void;
    setShowTimeWarningAlert: (show: boolean) => void;
    setApprovalState: (state: ApprovalState) => void;

    setLoadingCancel: (loading: boolean) => void;

    // actions
    fetchReasons: () => Promise<Reason[]>;
    hydrateFromStorage: () => void;
    startPause: (reasonId: string) => Promise<PauseResponse<AgentOperation>>;
    endPause: (correlationId: string) => Promise<PauseResponse<AgentOperation>>;
    startTimeTracking: () => void;
    stopTimeTracking: () => void;
    stopApprovalListener: () => void;
    clearApprovalState: () => void;

    // derived helpers
    getPauseCounters: (now?: number) => {
        elapsedSec: number;
        remainingSec: number;
        exceededSec: number;
        percent: number;
        exceeded: boolean;
    };

    clear: () => void;
}

let inFlightFetch: Promise<Reason[]> | null = null;

export const useReasonStore = create<ReasonState>()(
    persist(
        (set, get) => ({
            reasons: [],
            loading: false,
            loadingCancel: false,
            fetching: false,
            starting: false,
            ending: false,
            error: null,
            hasFetched: false,

            in_pause: false,
            correlationPause: {
                date_event: null,
                _id: null,
                accountcode: null,
                agent_id: null,
                createdAt: null,
                type_operation: null,
                updatedAt: null,
            },
            pauseStartedAt: null,
            pauseDurationSeconds: null,

            // approval state gerenciado pelo Zustand
            approvalState: {
                status: null,
                startedAt: null,
                reasonId: null,
                reasonName: null,
            },

            // UI states
            isPaused: false,
            isWaitingApproval: false,
            selectedReason: "",
            open: false,
            pauseTime: 0,
            pauseDuration: 0,
            isTimeExceeded: false,
            pauseProgressPercent: 0,
            progress: 0,
            timeExceededBy: 0,
            showTimeExceededAnimation: false,
            showEnterAnimation: false,
            showExitAnimation: false,
            showTimeExceededAlert: false,
            showTimeWarningAlert: false,
            currentPauseReason: "",

            approvalListener: null,
            timeInterval: null,

            setInPause: (inPause) => {
                set({ in_pause: inPause, isPaused: inPause });
                if (inPause) {
                    const state = get();
                    const reason_correlation =
                        state.correlationPause?.type_operation.reason;
                    const reasonFound = state.reasons.find(
                        (r) => r.id == reason_correlation
                    );
                    const dur = Number(reasonFound.timePause || 0);

                    set({
                        pauseDuration: dur,
                        progress: dur,
                        currentPauseReason: reasonFound.name ?? "",
                    });
                    get().startTimeTracking();
                } else {
                    set({
                        pauseDuration: 0,
                        progress: 0,
                        currentPauseReason: "",
                    });
                    get().stopTimeTracking();
                }
            },
            setCorrelationPause: (correlation) =>
                set({ correlationPause: correlation }),
            setReasons: (reasons) => set({ reasons }),
            setIsWaitingApproval: (waiting) =>
                set({ isWaitingApproval: waiting }),
            setSelectedReason: (reasonId) => set({ selectedReason: reasonId }),
            setOpen: (open) => set({ open }),
            setShowTimeExceededAlert: (show) =>
                set({ showTimeExceededAlert: show }),
            setShowTimeWarningAlert: (show) =>
                set({ showTimeWarningAlert: show }),
            setApprovalState: (state) => set({ approvalState: state }),

            setLoadingCancel: (loading) => set({ loadingCancel: loading }),

            clearApprovalState: () => {
                set({
                    approvalState: {
                        status: null,
                        startedAt: null,
                        reasonId: null,
                        reasonName: null,
                    },
                    isWaitingApproval: false,
                    selectedReason: "",
                });
            },

            startTimeTracking() {
                const state = get();
                if (state.timeInterval) clearInterval(state.timeInterval);

                const interval = setInterval(() => {
                    const currentState = get();
                    if (!currentState.in_pause) return;

                    const counters = currentState.getPauseCounters();
                    set({
                        pauseTime: counters.elapsedSec,
                        pauseProgressPercent: counters.percent,
                        progress: currentState.pauseDuration,
                        isTimeExceeded: counters.exceeded,
                        timeExceededBy: counters.exceededSec,
                    });

                    // 30s restantes alerta (apenas quando há limite)
                    if (
                        !counters.exceeded &&
                        counters.remainingSec === 30 &&
                        currentState.pauseDuration > 0
                    ) {
                        set({ showTimeWarningAlert: true });
                    }

                    if (
                        counters.exceeded &&
                        !currentState.showTimeExceededAlert
                    ) {
                        set({
                            showTimeExceededAnimation: true,
                            showTimeExceededAlert: true,
                        });
                        setTimeout(
                            () => set({ showTimeExceededAnimation: false }),
                            1500
                        );
                    }
                }, 1000);

                set({ timeInterval: interval });
            },

            stopTimeTracking() {
                const state = get();
                if (state.timeInterval) {
                    clearInterval(state.timeInterval);
                    set({
                        timeInterval: null,
                        pauseTime: 0,
                        pauseProgressPercent: 0,
                        progress: 0,
                        isTimeExceeded: false,
                        timeExceededBy: 0,
                    });
                }
            },

            stopApprovalListener() {
                const state = get();
                if (state.approvalListener) {
                    state.approvalListener();
                    set({ approvalListener: null });
                }
            },

            async fetchReasons() {
                if (get().hasFetched && get().reasons.length > 0)
                    return get().reasons;
                if (inFlightFetch) return inFlightFetch;

                set({ fetching: true, loading: true, error: null });
                const user = useAuthStore.getState().user;
                const token = user?.token;
                if (!token) {
                    set({
                        fetching: false,
                        loading: false,
                        error: "Usuário não autenticado",
                    });
                    return [];
                }

                const api = getApiService("pxtalkApi2", "private", token);
                inFlightFetch = (async () => {
                    try {
                        const { data, status } = await api.get(
                            "/painel-agents/list-custom-reason-pause"
                        );
                        if (status !== 200 || !Array.isArray(data))
                            throw new Error(
                                "Resposta inválida ao listar motivos de pausa"
                            );
                        const processed = data.map((r: any) =>
                            handleReasons(r)
                        ) as Reason[];
                        set({ reasons: processed, hasFetched: false });
                        return processed;
                    } catch (err: any) {
                        console.error("Erro ao buscar motivos de pausa:", err);
                        set({
                            error:
                                err?.message ||
                                "Erro ao buscar motivos de pausa",
                            hasFetched: true,
                        });
                        return [];
                    } finally {
                        set({ fetching: false, loading: false });
                        inFlightFetch = null;
                    }
                })();

                return inFlightFetch;
            },

            hydrateFromStorage() {
                try {
                    const state = get();

                    // 1) Reconstituir "aguardando aprovação" se ainda fizer sentido
                    if (
                        state.approvalState?.status === "waiting" &&
                        state.approvalState?.reasonId
                    ) {
                        // opcional: expirar pedido antigo (ex.: > 12h)
                        const startedAt = state.approvalState.startedAt ?? 0;
                        const maxAgeMs = 12 * 60 * 60 * 1000;
                        const stillFresh =
                            startedAt && Date.now() - startedAt < maxAgeMs;

                        if (stillFresh) {
                            set({
                                isWaitingApproval: true,
                                selectedReason: state.approvalState.reasonId,
                            });
                            return;
                        } else {
                            // limpa lixo velho
                            set({
                                approvalState: {
                                    status: null,
                                    startedAt: null,
                                    reasonId: null,
                                    reasonName: null,
                                },
                                isWaitingApproval: false,
                                selectedReason: "",
                            });
                        }
                    }

                    // 2) Reconstruir "pausa ativa" SOMENTE se os dados forem válidos
                    const corr = state.correlationPause;
                    const reasonId = corr?.type_operation?.reason;

                    // se não há correlação válida, garante reset
                    if (!corr || !corr._id || !reasonId) {
                        set({
                            in_pause: false,
                            isPaused: false,
                            pauseStartedAt: null,
                            pauseDurationSeconds: null,
                            currentPauseReason: "",
                        });
                        return;
                    }

                    // normaliza o date_event
                    const startedMs = toMs(corr.date_event);
                    if (!startedMs) {
                        // data inválida -> não reativa
                        set({
                            in_pause: false,
                            isPaused: false,
                            pauseStartedAt: null,
                            pauseDurationSeconds: null,
                            currentPauseReason: "",
                        });
                        return;
                    }

                    // garante que os motivos já estão em memória; se não, tenta reaproveitar depois
                    let reason = state.reasons.find((r) => r.id === reasonId);
                    if (!reason) {
                        // se ainda não buscou motivos, não religue nada agora;
                        // deixe para religar quando fetchReasons popular e então você chama hydrateFromStorage de novo (ou derive automaticamente).
                        // Para não "ferrar", faça reset leve aqui.
                        set({
                            in_pause: false,
                            isPaused: false,
                            pauseStartedAt: null,
                            pauseDurationSeconds: null,
                            currentPauseReason: "",
                        });
                        return;
                    }

                    // (Opcional) checar status "real" do ramal para garantir que ainda está em pausa
                    // const ext = useAppStore.getState().actualStateExtension;
                    // const reallyPaused = typeof ext?.status === "string" && ext.status.includes("PAUSE");
                    // if (!reallyPaused) { ...reset e return }

                    const durationSec = Number(reason.timePause || 0);

                    // Se tudo ok, reconstituímos o estado derivado SEM depender de `in_pause` persistido
                    set({
                        in_pause: true,
                        isPaused: true,
                        pauseStartedAt: startedMs,
                        pauseDurationSeconds: durationSec,
                        pauseDuration: durationSec,
                        progress: durationSec,
                        correlationPause: corr,
                        currentPauseReason: reason.name,
                    });

                    get().startTimeTracking();
                } catch (e) {
                    console.warn("hydrateFromStorage falhou:", e);
                    // fallback seguro
                    set({
                        in_pause: false,
                        isPaused: false,
                        pauseStartedAt: null,
                        pauseDurationSeconds: null,
                        currentPauseReason: "",
                    });
                }
            },

            async startPause(reasonId: string) {
                console.log("startPause chamado com reasonId:", reasonId);

                set({ starting: true, error: null });
                try {
                    const user = useAuthStore.getState().user;
                    const company = useAppStore.getState().company;
                    const registernumber =
                        useAppStore.getState().extension?.registernumber;
                    const extennumber =
                        useAppStore.getState().actualStateAgent?.extension;

                    if (!user || !company) {
                        console.error("Usuário ou empresa não encontrados");
                        return {
                            error: true,
                            message: "Usuário/empresa não encontrados",
                            data: null,
                        };
                    }

                    const reasonFound = get().reasons.find(
                        (r) => r.id === reasonId
                    );

                    if (!reasonFound) {
                        console.error(
                            "Motivo de pausa não encontrado:",
                            reasonId
                        );
                        return {
                            error: true,
                            message: "Motivo de pausa inválido",
                            data: null,
                        };
                    }

                    if (reasonFound.needsApproval) {
                        const approvalState: ApprovalState = {
                            status: "waiting",
                            startedAt: Date.now(),
                            reasonId,
                            reasonName: reasonFound.name,
                        };

                        set({
                            isWaitingApproval: true,
                            selectedReason: reasonId,
                            open: false,
                            approvalState,
                        });

                        try {
                            await sendPauseRequest({
                                accountcode: company.accountcode,
                                agentLogin: user.login,
                                reasonId,
                                reasonName: reasonFound.name,
                                startedAt: approvalState.startedAt!,
                                status: "pending",
                            });
                            console.log(
                                "Requisição enviada ao Firebase com sucesso"
                            );

                            // Log Firestore: pending
                            const { userFirebase } = useAuthStore.getState();
                            if (userFirebase?.userId) {
                                const key = `pause_request_${approvalState.startedAt}`;
                                await upsertProfileRequest(
                                    company.accountcode,
                                    userFirebase.userId,
                                    key,
                                    {
                                        reasonId,
                                        reasonName: reasonFound.name,
                                        status: "pending",
                                        timestamp: new Date().toISOString(),
                                        userId: userFirebase.userId,
                                        userName:
                                            userFirebase.name || "Usuário",
                                        agentLogin: user.login,
                                    } as any
                                );
                            }
                        } catch (firebaseError) {
                            console.error(
                                "Erro ao enviar requisição ao Firebase:",
                                firebaseError
                            );
                            get().clearApprovalState();
                            return {
                                error: true,
                                message:
                                    "Erro ao enviar requisição de aprovação",
                                data: null,
                            };
                        }

                        // Escuta resposta de aprovação
                        const stopListener = listenPauseRequestStatus(
                            company.accountcode,
                            user.login,
                            async (data) => {
                                console.log(
                                    "Status de aprovação recebido:",
                                    data
                                );

                                if (!data) return;

                                // Atualiza histórico no Firestore com approved/rejected
                                try {
                                    const { userFirebase } =
                                        useAuthStore.getState();

                                    if (
                                        userFirebase?.userId &&
                                        data.startedAt
                                    ) {
                                        const key = `pause_request_${data.startedAt}`;
                                        const base = {
                                            reasonId: data.reasonId,
                                            reasonName: data.reasonName,
                                            timestamp: new Date().toISOString(),
                                            userId: userFirebase.userId,
                                            userName:
                                                userFirebase.name || "Usuário",
                                            agentLogin: user.login,
                                        } as any;

                                        if (data.status === "approved") {
                                            await upsertProfileRequest(
                                                company.accountcode,
                                                userFirebase.userId,
                                                key,
                                                {
                                                    ...base,
                                                    status: "approved",
                                                } as any
                                            );
                                        } else if (data.status === "rejected") {
                                            await upsertProfileRequest(
                                                company.accountcode,
                                                userFirebase.userId,
                                                key,
                                                {
                                                    ...base,
                                                    status: "rejected",
                                                    rejectionReason:
                                                        data.rejectionReason ||
                                                        "",
                                                } as any
                                            );
                                        }
                                    }
                                } catch (e) {
                                    console.warn(
                                        "Falha ao atualizar histórico de request:",
                                        e
                                    );
                                }

                                if (data.status === "approved") {
                                    get().stopApprovalListener();
                                    const registernumber =
                                        useAppStore.getState().extension
                                            ?.registernumber;
                                    const extennumber =
                                        useAppStore.getState().actualStateAgent
                                            ?.extension;

                                    await removePauseRequest(
                                        company.accountcode,
                                        user.login
                                    );
                                    set({
                                        isWaitingApproval: false,
                                        showEnterAnimation: true,
                                    });

                                    systemNotify({
                                        title: "Pausa aprovada",
                                        message:
                                            "Sua solicitação de pausa foi aprovada pelo supervisor.",
                                        variant: "success",
                                        type: "system",
                                    });

                                    get().clearApprovalState();
                                    setTimeout(
                                        () =>
                                            set({ showEnterAnimation: false }),
                                        800
                                    );

                                    // Agora inicia de fato a pausa
                                    try {
                                        const api = getApiService(
                                            "pxtalkApi2",
                                            "private",
                                            user.token
                                        );
                                        const params = {
                                            accountcode: company.accountcode,
                                            registernumber,
                                            extennumber,
                                            agent: {
                                                login: user?.login,
                                                password: user?.password,
                                            },

                                            reason: reasonId,
                                        };

                                        const { data: apiData, status } =
                                            await api.post(
                                                "/painel-agents/pauseV2",
                                                params
                                            );
                                        if (
                                            status < 200 ||
                                            status >= 300 ||
                                            !apiData?.agentOperation
                                        )
                                            throw new Error(
                                                apiData?.message ||
                                                    "Erro ao iniciar pausa"
                                            );

                                        const op =
                                            apiData.agentOperation as AgentOperation;
                                        await changeStatusAgent(
                                            user.id,
                                            company.accountcode,
                                            "in_pause"
                                        );

                                        const startedAt = Number(op?.date_event)
                                            ? Number(op.date_event) * 1000
                                            : Date.now();

                                        set({
                                            in_pause: true,
                                            isPaused: true,
                                            pauseStartedAt: startedAt,
                                            pauseDurationSeconds: Number(
                                                reasonFound.timePause || 0
                                            ),
                                            pauseDuration: Number(
                                                reasonFound.timePause || 0
                                            ),
                                            progress: Number(
                                                reasonFound.timePause || 0
                                            ),
                                            correlationPause: op,
                                            currentPauseReason:
                                                reasonFound.name,
                                        });

                                        get().startTimeTracking();
                                    } catch (error: any) {
                                        console.error(
                                            "Erro ao iniciar pausa aprovada:",
                                            error
                                        );
                                        get().clearApprovalState();
                                    }
                                }

                                if (data.status === "rejected") {
                                    console.log(
                                        "Pausa rejeitada - processando notificação"
                                    );
                                    console.log("Dados da rejeição:", data);
                                    get().stopApprovalListener();
                                    await removePauseRequest(
                                        company.accountcode,
                                        user.login
                                    );

                                    // Toast de reprovação
                                    const notifResult = systemNotify({
                                        title: "Pausa rejeitada ❌",
                                        message:
                                            data.rejectionReason ||
                                            "Sua solicitação de pausa foi rejeitada pelo supervisor.",
                                        variant: "error",
                                        type: "system",
                                    });
                                    console.log(
                                        "Resultado do systemNotify:",
                                        notifResult
                                    );
                                    get().clearApprovalState();
                                    set({ open: true });
                                }
                            }
                        );

                        set({ approvalListener: stopListener });
                        return {
                            error: false,
                            message: "Aguardando aprovação",
                            data: null,
                        };
                    }

                    const api = getApiService(
                        "pxtalkApi2",
                        "private",
                        user.token
                    );

                    const params = {
                        accountcode: company.accountcode,
                        registernumber,
                        extennumber,
                        agent: {
                            login: user?.login,
                            password: user?.password,
                        },

                        reason: reasonId,
                    };

                    const { data, status } = await api.post(
                        "/painel-agents/pauseV2",
                        params
                    );

                    if (
                        status < 200 ||
                        status >= 300 ||
                        !data?.agentOperation
                    ) {
                        console.error("Erro na API de pausa:", data);
                        return {
                            error: true,
                            message: data?.message || "Erro ao iniciar pausa",
                            data: null,
                        };
                    }

                    const op = data.agentOperation as AgentOperation;
                    await changeStatusAgent(
                        user.id,
                        company.accountcode,
                        "in_pause"
                    );

                    const startedAt = Number(op?.date_event)
                        ? Number(op.date_event) * 1000
                        : Date.now();

                    set({
                        in_pause: true,
                        isPaused: true,
                        pauseStartedAt: startedAt,
                        pauseDurationSeconds: Number(
                            reasonFound.timePause || 0
                        ),
                        pauseDuration: Number(reasonFound.timePause || 0),
                        progress: Number(reasonFound.timePause || 0),
                        correlationPause: op,
                        currentPauseReason: reasonFound.name,
                        open: false,
                        showEnterAnimation: true,
                    });

                    setTimeout(() => set({ showEnterAnimation: false }), 800);
                    get().startTimeTracking();

                    return {
                        error: false,
                        message: "Pausa iniciada com sucesso",
                        data: op,
                    };
                } catch (error: any) {
                    console.error("Erro ao iniciar pausa:", error);
                    return {
                        error: true,
                        message: error?.message || "Erro ao iniciar pausa",
                        data: null,
                    };
                } finally {
                    set({ starting: false });
                }
            },

            async endPause(correlationId: string) {
                const user = useAuthStore.getState().user;
                const company = useAppStore.getState().company;
                const op = get().correlationPause;
                const registernumber =
                    useAppStore.getState().extension?.registernumber;
                const extennumber =
                    useAppStore.getState().actualStateAgent?.extension;

                set({ ending: true, error: null, showExitAnimation: true });

                setTimeout(async () => {
                    try {
                        const api = getApiService(
                            "pxtalkApi2",
                            "private",
                            user.token
                        );
                        const params = {
                            accountcode: company.accountcode,
                            registernumber,
                            extennumber,
                            agent: {
                                login: user?.login,
                                password: user?.password,
                            },

                            correlation_type_id: correlationId,
                        };
                        const { data, status } = await api.post(
                            "/painel-agents/unpauseV2",
                            params
                        );
                        if (status !== 200 || !data?.agentOperation)
                            throw new Error(
                                data?.message || "Erro ao finalizar pausa"
                            );

                        await changeStatusAgent(
                            user.id,
                            company.accountcode,
                            "logged"
                        );

                        set({
                            in_pause: false,
                            isPaused: false,
                            pauseStartedAt: null,
                            pauseDurationSeconds: null,
                            correlationPause: {
                                _id: null,
                                date_event: null,
                                accountcode: null,
                                agent_id: null,
                                createdAt: null,
                                type_operation: null,
                                updatedAt: null,
                            },
                            currentPauseReason: "",
                            progress: 0,
                            showExitAnimation: false,
                        });

                        get().stopTimeTracking();
                        return {
                            error: false,
                            message: "Pausa finalizada com sucesso",
                            data: data.agentOperation as AgentOperation,
                        };
                    } catch (error: any) {
                        console.error("Erro ao finalizar pausa:", error);
                        set({ showExitAnimation: false });
                        return {
                            error: true,
                            message:
                                error?.message || "Erro ao finalizar pausa",
                            data: null,
                        };
                    } finally {
                        set({ ending: false });
                    }
                }, 400);

                return {
                    error: false,
                    message: "Finalizando pausa...",
                    data: null,
                };
            },

            getPauseCounters(now = Date.now()) {
                const started = get().pauseStartedAt;
                const total = get().pauseDurationSeconds || 0;

                if (!started)
                    return {
                        elapsedSec: 0,
                        remainingSec: total,
                        exceededSec: 0,
                        percent: 0,
                        exceeded: false,
                    };
                const elapsedSec = Math.max(
                    0,
                    Math.floor((now - started) / 1000)
                );
                const remainingSec = Math.max(
                    0,
                    total > 0 ? total - elapsedSec : 0
                );
                const exceededSec =
                    total > 0 && elapsedSec > total ? elapsedSec - total : 0;
                const exceeded = exceededSec > 0;
                const percent =
                    total > 0 ? Math.min(100, (elapsedSec / total) * 100) : 0;

                return {
                    elapsedSec,
                    remainingSec,
                    exceededSec,
                    percent,
                    exceeded,
                };
            },

            clear: () => {
                const state = get();
                state.stopTimeTracking();
                state.stopApprovalListener();

                set({
                    reasons: [],
                    loading: false,
                    fetching: false,
                    starting: false,
                    ending: false,
                    error: null,
                    hasFetched: false,
                    in_pause: false,
                    correlationPause: {
                        _id: null,
                        date_event: null,
                        accountcode: null,
                        agent_id: null,
                        createdAt: null,
                        type_operation: null,
                        updatedAt: null,
                    },
                    pauseStartedAt: null,
                    pauseDurationSeconds: null,
                    approvalState: {
                        status: null,
                        startedAt: null,
                        reasonId: null,
                        reasonName: null,
                    },
                    isPaused: false,
                    isWaitingApproval: false,
                    selectedReason: "",
                    open: false,
                    pauseTime: 0,
                    pauseDuration: 0,
                    isTimeExceeded: false,
                    pauseProgressPercent: 0,
                    progress: 0,
                    timeExceededBy: 0,
                    showTimeExceededAnimation: false,
                    showEnterAnimation: false,
                    showExitAnimation: false,
                    showTimeExceededAlert: false,
                    showTimeWarningAlert: false,
                    currentPauseReason: "",
                    approvalListener: null,
                    timeInterval: null,
                });

                localStorage.removeItem("reasons-storage");
            },
        }),
        {
            name: "reasons-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({
                reasons: s.reasons,
                hasFetched: s.hasFetched,
                pauseStartedAt: s.pauseStartedAt,
                pauseDurationSeconds: s.pauseDurationSeconds,
                correlationPause: s.correlationPause,
                approvalState: s.approvalState,
            }),
        }
    )
);
