import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getApiService } from "@/lib/api/services";

import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import {
    getCurrentDateFormatted,
    getCurrentDateFormattedTicket,
} from "@/utils/tableStore";
import { getBancoIds, handleTicketV2 } from "@/utils/handleTickets";
import {
    AgentOperation,
    PairedPause,
    TicketData as TicketDataType,
} from "@/types";
import { useReasonStore } from "./reasonStore";
import { AudioMap, CallTicket, CallTicketWithMedia } from "@/types/tableStore";

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface TicketData {
    data: TicketDataType[];
    pagination: Pagination;
}

interface TableState {
    tickets: TicketData;
    reasonsData: PairedPause[];
    isActive: boolean;
    abortController: AbortController | null;

    setTickets: (tickets: any[], pagination: Pagination) => void;
    setReasons: (reasons: PairedPause[]) => void;
    setActive: (active: boolean) => void;

    fetchTickets: (page?: number, limit?: number) => Promise<void>;
    fetchReasonsData: () => Promise<void>;
    cancelRequests: () => void;

    clear: () => void;
}

export const useTableStore = create<TableState>()(
    persist(
        (set, get) => ({
            tickets: {
                data: [] as TicketDataType[],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0,
                },
            },

            reasonsData: [],
            isActive: false,
            abortController: null,

            setTickets: (tickets, pagination) =>
                set({ tickets: { data: tickets, pagination } }),
            setReasons: (reasons) => set({ reasonsData: reasons }),
            setActive: (active) => {
                set({ isActive: active });
                if (!active) {
                    get().cancelRequests();
                }
            },

            cancelRequests: () => {
                const { abortController } = get();
                if (abortController) {
                    abortController.abort();
                    set({ abortController: null });
                }
            },

            async fetchTickets(page = 1, limit = 10) {
                const state = get();

                // Cancela requisições anteriores
                state.cancelRequests();

                // Verifica se ainda está ativo
                if (!state.isActive) {
                    console.log(
                        "TableStore inativo, cancelando busca de tickets"
                    );
                    return;
                }

                // Cria novo controller para esta requisição
                const controller = new AbortController();
                set({ abortController: controller });

                try {
                    const authState = useAuthStore.getState();
                    const appState = useAppStore.getState();

                    // Validações de segurança
                    if (
                        !authState.user?.login ||
                        !authState.user?.token ||
                        !appState.company?.accountcode
                    ) {
                        console.warn(
                            "Dados de autenticação ou empresa não encontrados"
                        );
                        set({
                            tickets: {
                                data: [],
                                pagination: {
                                    page: 1,
                                    limit: 10,
                                    total: 0,
                                    totalPages: 0,
                                },
                            },
                        });
                        return;
                    }

                    const agente_login = authState.user.login;
                    const company = appState.company;
                    const token = authState.user.token;

                    const { start_date, end_date } =
                        getCurrentDateFormattedTicket();
                    const query = { start_date, end_date, agente_login };

                    // Verifica se ainda está ativo antes de fazer a requisição
                    if (!get().isActive) {
                        console.log(
                            "TableStore desativado durante preparação da requisição"
                        );
                        return;
                    }

                    // 1) busca tickets
                    const api2 = getApiService("pxtalkApi2", "private", token);
                    const api3 = getApiService("pxtalkApi3", "private", token);

                    const { data: respTickets } = await api3.post(
                        `/custom-ticktes?accountcode=${company.accountcode}&page=${page}&limit=${limit}`,
                        query,
                        { signal: controller.signal }
                    );

                    if (!get().isActive) {
                        console.log(
                            "TableStore desativado após busca de tickets"
                        );
                        return;
                    }

                    const rawTickets: CallTicket[] = Array.isArray(
                        respTickets?.data
                    )
                        ? respTickets.data
                        : [];
                    const list_ids = getBancoIds(rawTickets);
                    let audioItems: AudioMap[] = [];

                    if (list_ids.length > 0) {
                        const { data: respAudio } = await api2.post(
                            "bilhetes/link-audio-list-ids",
                            { list_ids },
                            { signal: controller.signal }
                        );

                        // Verifica se ainda está ativo após a segunda requisição
                        if (!get().isActive) {
                            console.log(
                                "TableStore desativado após busca de áudio"
                            );
                            return;
                        }

                        const arr: any[] = Array.isArray(respAudio)
                            ? respAudio
                            : [];

                        audioItems = arr
                            .map((it) => ({
                                id: String(it.id ?? ""),
                                audiorecord: it.audiorecord ?? null,
                                videoLink: it.videoLink ?? null,
                            }))
                            .filter((it: AudioMap) => it.id.length > 0);
                    }

                    const audioMap = new Map<string, AudioMap>(
                        audioItems.map((item) => [item.id, item])
                    );
                    const enriched: CallTicketWithMedia[] = rawTickets.map(
                        (t) => {
                            const audio = audioMap.get(t.banco_id);
                            return {
                                ...t,
                                real_audiorecord: audio?.audiorecord ?? null,
                                real_videoLink: audio?.videoLink ?? null,
                            };
                        }
                    );

                    const tickets = enriched.map((ticket) =>
                        handleTicketV2(ticket)
                    );

                    // Verificação final antes de atualizar o estado
                    if (get().isActive) {
                        set({
                            tickets: {
                                data: tickets,
                                pagination: {
                                    page: respTickets?.pagination?.page || 1,
                                    limit: respTickets?.pagination?.limit || 10,
                                    total:
                                        respTickets?.pagination?.total_itens ||
                                        0,
                                    totalPages:
                                        respTickets?.pagination?.total_pages ||
                                        0,
                                },
                            },
                            abortController: null,
                        });
                    }
                } catch (err: any) {
                    if (err.name === "AbortError") {
                        console.log("Requisição de tickets cancelada");
                        return;
                    }

                    console.debug("Erro ao buscar dados:", err);
                    if (get().isActive) {
                        set({
                            tickets: {
                                data: [],
                                pagination: {
                                    page: 1,
                                    limit: 10,
                                    total: 0,
                                    totalPages: 0,
                                },
                            },
                            abortController: null,
                        });
                    }
                }
            },

            async fetchReasonsData() {
                const state = get();

                // Cancela requisições anteriores
                state.cancelRequests();

                // Verifica se ainda está ativo
                if (!state.isActive) {
                    console.log(
                        "TableStore inativo, cancelando busca de motivos"
                    );
                    return;
                }

                // Cria novo controller para esta requisição
                const controller = new AbortController();
                set({ abortController: controller });

                try {
                    const authState = useAuthStore.getState();
                    const appState = useAppStore.getState();
                    const reasonsState = useReasonStore.getState();

                    // Validações de segurança
                    if (
                        !authState.user?.id ||
                        !authState.user?.token ||
                        !appState.company?.accountcode
                    ) {
                        console.warn(
                            "Dados de autenticação ou empresa não encontrados para busca de motivos"
                        );
                        set({ reasonsData: [] });
                        return;
                    }

                    const user = authState.user;
                    const company = appState.company;
                    const reasons = reasonsState.reasons;

                    const filterDate = getCurrentDateFormatted();
                    const url = `painel-agents/agents-operations?accountcode=${company.accountcode}&agent_id=${user.id}&type[]=pause&type[]=unpause&${filterDate}`;

                    // Verifica se ainda está ativo antes de fazer a requisição
                    if (!get().isActive) {
                        console.log(
                            "TableStore desativado durante preparação da requisição de motivos"
                        );
                        return;
                    }

                    const api = getApiService(
                        "pxtalkApi2",
                        "private",
                        user.token
                    );
                    const { data } = await api.get(url, {
                        signal: controller.signal,
                    });

                    // Verifica se ainda está ativo após a requisição
                    if (!get().isActive) {
                        console.log(
                            "TableStore desativado após busca de motivos"
                        );
                        return;
                    }

                    const events: AgentOperation[] = data;

                    // Separar os eventos
                    const pauses = events.filter(
                        (e) => e.type_operation.type === "pause"
                    );
                    const unpauses = events.filter(
                        (e) => e.type_operation.type === "unpause"
                    );

                    // Mapear pausas completas
                    const paired: PairedPause[] = pauses
                        .map((pause) => {
                            const match = unpauses.find(
                                (unpause) =>
                                    unpause.type_operation
                                        .correlation_type_id === pause._id
                            );
                            if (!match) return null;

                            const reason = reasons.find(
                                (r) =>
                                    r.id === pause.type_operation.reason ||
                                    r.name.toLocaleLowerCase() ==
                                        pause.type_operation.reason
                            );

                            const startedAt = new Date(pause.date_event);
                            const endedAt = new Date(match.date_event);
                            const durationInSeconds = Math.floor(
                                (endedAt.getTime() - startedAt.getTime()) / 1000
                            );

                            return {
                                id: pause._id,
                                reason: reason
                                    ? reason.name
                                    : pause.type_operation.reason ||
                                      "Não informado",
                                startedAt: startedAt.toISOString(),
                                endedAt: endedAt.toISOString(),
                                durationInSeconds,
                            };
                        })
                        .filter(Boolean) as PairedPause[];

                    // Verificação final antes de atualizar o estado
                    if (get().isActive) {
                        set({ reasonsData: paired, abortController: null });
                    }
                } catch (error: any) {
                    if (error.name === "AbortError") {
                        console.log("Requisição de motivos cancelada");
                        return;
                    }

                    console.error("Erro ao buscar motivos:", error);
                    if (get().isActive) {
                        set({ reasonsData: [], abortController: null });
                    }
                }
            },

            clear: () => {
                get().cancelRequests();
                set({
                    tickets: {
                        data: [],
                        pagination: {
                            page: 1,
                            limit: 10,
                            total: 0,
                            totalPages: 0,
                        },
                    },
                    reasonsData: [],
                    isActive: false,
                    abortController: null,
                });

                localStorage.removeItem("tables-storage");
            },
        }),
        {
            name: "tables-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                tickets: state.tickets,
                reasonsData: state.reasonsData,
            }),
        }
    )
);
