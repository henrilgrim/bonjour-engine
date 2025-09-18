import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getApiService } from "@/lib/api/services";
import { Extension, type Company } from "@/types/app-store";
import { useAuthStore } from "./authStore";

type ExtensionStatus = {
    status: string;
    registerNumber: string;
    displayName: string;
    sipUserAgent: string;
};

export type AgentStatus = {
    name: string;
    queues: {
        id: string;
        name: string;
        status: boolean;
        priority: number;
    }[];
    extension: string;
};

interface AppState {
    code: string | null;
    company: Company | null;
    extension: Extension | null;

    // estados
    actualStateExtension: ExtensionStatus | null;
    actualStateAgent: AgentStatus | null;

    // flags
    isLoading: boolean;
    companyLoading: boolean;
    extensionLoading: boolean;
    actualStateExtensionLoading: boolean;
    actualStateAgentLoading: boolean;

    alreadyHeard: string[];

    // erros
    error: string | null;
    hasFetchedCompany: boolean;

    // setters
    setCode: (code: string) => void;
    setCompany: (company: Company | null) => void;
    setExtension: (extension: Extension | null) => void;
    setActualStateExtension: (status: ExtensionStatus | null) => void;
    setActualAgentStatus: (status: AgentStatus | null) => void;
    setHasFetchedCompany: (value: boolean) => void;
    setAlreadyHeard: (ticketId: string) => void;

    // actions
    checkCompanyCode: (
        code: string
    ) => Promise<{ error: boolean; message?: string; company?: Company }>;

    checkExtensionRegistered: (
        accountcode: string,
        ramal: string
    ) => Promise<{ error: boolean; message?: string }>;

    checkExtensionStatus: () => Promise<{ error: boolean; message?: string }>;

    checkAgentStatus: () => Promise<{ error: boolean; message?: string }>;

    clear: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            code: null,
            company: null,
            extension: null,

            actualStateExtension: null,
            actualStateAgent: null,

            isLoading: false,
            companyLoading: false,
            extensionLoading: false,
            actualStateExtensionLoading: false,
            actualStateAgentLoading: false,

            alreadyHeard: [],

            error: null,
            hasFetchedCompany: false,

            setCode: (code: string) =>
                set((s) => {
                    const changed = s.code !== code;
                    return changed
                        ? {
                              code,
                              company: null,
                              hasFetchedCompany: false,
                              error: null,
                          }
                        : { code };
                }),

            setCompany: (company: Company | null) => set({ company }),

            setExtension: (extension: Extension | null) => set({ extension }),

            setActualStateExtension: (status: ExtensionStatus | null) =>
                set({ actualStateExtension: status }),

            setActualAgentStatus: (status: AgentStatus | null) =>
                set({ actualStateAgent: status }),

            setHasFetchedCompany: (value: boolean) =>
                set({ hasFetchedCompany: value }),

            setAlreadyHeard: (ticketId: string) =>
                set((s) => ({
                    alreadyHeard: s.alreadyHeard.includes(ticketId)
                        ? s.alreadyHeard
                        : [...s.alreadyHeard, ticketId],
                })),

            async checkCompanyCode(code) {
                // se já buscamos e a empresa atual bate com o código, evita novo request
                if (
                    get().hasFetchedCompany &&
                    get().company?.accountcode === code
                ) {
                    return { error: false, company: get().company! };
                }

                // se o código atual no store é diferente, zera estado dependente
                if (get().code !== code) {
                    set({ code, company: null, hasFetchedCompany: false });
                }

                set({ isLoading: true, companyLoading: true, error: null });
                try {
                    const api = getApiService("pxtalkApi2", "public");
                    const { data, status } = await api.post(
                        "/painel-agents/verify-code-company",
                        { code }
                    );

                    // normalização + validações
                    if (
                        status !== 200 ||
                        !data ||
                        !data.accountcode ||
                        !data.id
                    ) {
                        set({
                            error: "Empresa inválida",
                            hasFetchedCompany: true,
                        });
                        return { error: true, message: "Empresa inválida" };
                    }

                    set({
                        company: data as Company,
                        hasFetchedCompany: true,
                    });

                    return { error: false, company: data as Company };
                } catch (error: any) {
                    set({
                        error:
                            error?.message ||
                            "Erro ao verificar o código da empresa",
                        hasFetchedCompany: true,
                    });
                    return {
                        error: true,
                        message: "Erro ao verificar o código da empresa",
                    };
                } finally {
                    set({ isLoading: false, companyLoading: false });
                }
            },

            async checkExtensionRegistered(accountcode: string, ramal: string) {
                set({ extensionLoading: true });
                try {
                    const api = getApiService("pxtalkApi2", "public");
                    const { data, status } = await api.post(
                        "/painel-agents/detail-sip-Exten",
                        { accountcode, ramal }
                    );

                    if (status !== 200 || !data || data.error)
                        return {
                            error: true,
                            message:
                                data?.message ||
                                "Erro ao verificar extensão registrada",
                        };
                    if (!String(data.status || "").includes("OK"))
                        return {
                            error: true,
                            message: "Ramal não está registrado no PBX",
                        };

                    set({
                        extension: {
                            displayname: data.displayname,
                            registernumber: data.registernumber,
                            secret: data.secret,
                            host: data.host,
                            wss: data.wss,
                        },

                        actualStateExtension: {
                            status: data.status,
                            registerNumber: data.registernumber,
                            displayName: data.displayname,
                            sipUserAgent: data["sip-useragent"],
                        },
                    });

                    return {
                        error: false,
                        message: "Extensão registrada com sucesso",
                    };
                } catch (err: any) {
                    console.error(
                        "Erro ao verificar extensão registrada:",
                        err
                    );
                    set({ extension: null });
                    return {
                        error: true,
                        message:
                            err?.message ||
                            "Erro desconhecido ao verificar extensão registrada",
                    };
                } finally {
                    console.debug(
                        "Requisição para verificar extensão registrada finalizada."
                    );
                    set({ extensionLoading: false });
                }
            },

            async checkExtensionStatus() {
                set({ actualStateExtensionLoading: true });
                try {
                    const accountcode = get().company.accountcode;
                    const ramal = useAuthStore.getState().user.extension;
                    if (!accountcode) {
                        return {
                            error: true,
                            message:
                                "Código da empresa não encontrado para verificar extensão",
                        };
                    }

                    const api = getApiService("pxtalkApi2", "public");
                    const { data, status } = await api.post(
                        "/painel-agents/detail-sip-Exten",
                        { accountcode, ramal }
                    );
                    if (status !== 200 || !data || data.error)
                        return {
                            error: true,
                            message:
                                data?.message ||
                                "Erro ao verificar extensão registrada",
                        };

                    set({
                        actualStateExtension: {
                            status: data.status,
                            registerNumber: data.registernumber,
                            displayName: data.displayname,
                            sipUserAgent: data["sip-useragent"],
                        },
                    });

                    return {
                        error: false,
                        message: "Extensão registrada com sucesso",
                    };
                } catch (err: any) {
                    console.error(
                        "Erro ao verificar extensão registrada:",
                        err
                    );
                    set({ actualStateExtension: null });
                    return {
                        error: true,
                        message:
                            err?.message ||
                            "Erro desconhecido ao verificar extensão registrada",
                    };
                } finally {
                    console.debug(
                        "Requisição para verificar extensão registrada finalizada."
                    );
                    set({ actualStateExtensionLoading: false });
                }
            },

            async checkAgentStatus() {
                set({ actualStateAgentLoading: true });
                try {
                    const user = useAuthStore.getState().user;
                    if (!user) {
                        return {
                            error: true,
                            message: "Usuário não autenticado",
                        };
                    }

                    const agentId = user.id;
                    const token = user.token;
                    const registerNumber = get().extension?.registernumber;

                    const api = getApiService("pxtalkApi2", "private", token);
                    const { data, status } = await api.get(
                        `/painel-agents/status-agentV2/${agentId}/${registerNumber}`
                    );

                    if (status !== 200 || !data || data.error) {
                        return {
                            error: true,
                            message:
                                data?.message ||
                                "Erro ao verificar status do agente",
                        };
                    }

                    // data deve ser um array de { queue: string, status: boolean }
                    const queueStatuses: { queue: string; status: boolean }[] =
                        data;

                    // pega o estado atual salvo no store
                    const current = get().actualStateAgent;

                    if (!current) {
                        return {
                            error: true,
                            message: "Estado do agente não inicializado",
                        };
                    }

                    // atualiza o status das filas
                    const updatedQueues = current.queues.map((q) => {
                        const match = queueStatuses.find(
                            (s) => s.queue === q.id
                        );
                        return {
                            ...q,
                            status: match ? match.status : false,
                        };
                    });

                    const updatedAgent: AgentStatus = {
                        ...current,
                        queues: updatedQueues,
                    };

                    set({ actualStateAgent: updatedAgent });

                    // verifica se TODAS as filas estão logadas
                    const allOk = updatedQueues.every((q) => q.status);

                    if (!allOk) {
                        return {
                            error: true,
                            message: "Agente não está logado em todas as filas",
                        };
                    }

                    return { error: false, message: "Agente está logado" };
                } catch (err: any) {
                    console.error("Erro ao verificar status do agente:", err);
                    set({ actualStateAgent: null });
                    return {
                        error: true,
                        message:
                            err?.message ||
                            "Erro desconhecido ao verificar status do agente",
                    };
                } finally {
                    console.debug(
                        "Requisição para verificar status do agente finalizada."
                    );
                    set({ actualStateAgentLoading: false });
                }
            },

            clear: () => {
                set({
                    extension: null,
                    actualStateAgent: null,
                    actualStateExtension: null,

                    alreadyHeard: [],
                    isLoading: false,
                    companyLoading: false,
                    extensionLoading: false,
                    actualStateExtensionLoading: false,
                    error: null,
                    hasFetchedCompany: false,
                });
            },
        }),
        {
            name: "app-storage",
            storage: createJSONStorage(() => localStorage),

            partialize: (state) => ({
                code: state.code,
                company: state.company,
                extension: state.extension,
                actualStateAgent: state.actualStateAgent,
                actualStateExtension: state.actualStateExtension,
                alreadyHeard: state.alreadyHeard,
            }),
        }
    )
);
