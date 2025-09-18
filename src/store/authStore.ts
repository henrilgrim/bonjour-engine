import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getApiService } from "@/lib/api/services";
import { Agent } from "@/types/auth-store";
import { AgentStatus, useAppStore } from "@/store/appStore";
import generateUserDataFormatted from "@/utils/generateUserDataFormatted";
import { Profile } from "@/lib/firebase/firestore/profiles/types";

interface AuthState {
    isAuthenticated: boolean;
    user: Agent | null;
    userFirebase: Profile | null;

    loading: boolean;
    isLoading: boolean;
    error: string | null;

    setUser: (user: Agent) => void;
    setUserFirebase: (userFirebase: Profile | null) => void;
    setIsAuthenticated: (isAuthenticated: boolean) => void;

    signIn: (
        extension: string,
        login: string,
        password: string
    ) => Promise<{ error: boolean; message?: string }>;
    signOut: () => Promise<{ error: boolean; message?: string }>;
    clear: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            user: null,
            userFirebase: null,

            loading: false,
            isLoading: false,
            error: null,

            setUser: (user: Agent) => set({ user }),
            setUserFirebase: (userFirebase: Profile | null) =>
                set({ userFirebase }),
            setIsAuthenticated: (isAuthenticated: boolean) =>
                set({ isAuthenticated }),

            async signIn(extension, login, password) {
                set({ loading: true, error: null });

                try {
                    const company = useAppStore.getState().company;
                    const setActualAgentStatus =
                        useAppStore.getState().setActualAgentStatus;

                    // ANTIGO:
                    // const { data, status } = await getApiService("pxtalkApi2", "public").post('/painel-agents/login', {
                    // 	accountcode: company.accountcode,
                    // 	ramal: extension,
                    // 	login,
                    // 	senha: password
                    // });

                    const registernumber =
                        useAppStore.getState().extension.registernumber;

                    const { data, status } = await getApiService(
                        "pxtalkApi2",
                        "public"
                    ).post("/painel-agents/loginV2", {
                        accountcode: company.accountcode,
                        registernumber,
                        extennumber: extension,
                        agent: {
                            login,
                            password,
                        },
                    });

                    const { agent } = data;

                    const agentStatus: AgentStatus = {
                        name: agent.name,
                        extension,
                        queues: (agent.multipleQueuesEnabled
                            ? agent.queues
                            : []
                        ).map((q) => ({
                            id: q.queue._id,
                            name: q.queue.key["queue-name"],
                            status: false,
                            priority: q.priority,
                        })),
                    };

                    // salva corretamente no AppStore
                    setActualAgentStatus(agentStatus);

                    if (status !== 200 || !data)
                        throw new Error("Dados inválidos retornados pela API.");

                    const formattedUser = generateUserDataFormatted({
                        ...data,
                        extension,
                    }) as Agent;

                    set({ user: formattedUser, loading: false });
                    return { error: false };
                } catch (err: any) {
                    const message: string =
                        err?.details?.message ||
                        err?.response?.data?.message ||
                        err?.message ||
                        "Erro desconhecido.";
                    if (message.startsWith("Agente já está logado no ramal")) {
                        try {
                            const ramalConflitante =
                                message.match(/ramal: (\d+)/)?.[1] ?? null;

                            if (
                                ramalConflitante &&
                                ramalConflitante === extension
                            ) {
                                await getApiService(
                                    "pxtalkApi2",
                                    "public"
                                ).post("/painel-agents/logout", {
                                    accountcode:
                                        useAppStore.getState().company
                                            .accountcode,
                                    ramal: extension,
                                    login,
                                    senha: password,
                                });

                                return {
                                    error: false,
                                    message:
                                        "Sessão anterior desconectada. Tente novamente.",
                                };
                            } else {
                                return {
                                    error: true,
                                    message: `Agente já está logado no ramal: ${ramalConflitante}`,
                                };
                            }
                        } catch (logoutErr: any) {
                            const m =
                                logoutErr?.details?.message ||
                                logoutErr?.response?.data?.message ||
                                logoutErr?.message ||
                                "Erro desconhecido.";

                            if (m.includes("Extension does not exist")) {
                                return {
                                    error: false,
                                    message:
                                        "Sessão anterior desconectada. Tente novamente.",
                                };
                            } else {
                                return {
                                    error: true,
                                    message:
                                        "Erro ao finalizar sessão anterior. Tente novamente.",
                                };
                            }
                        }
                    } else {
                        return { error: true, message };
                    }
                } finally {
                    set({ loading: false });
                }
            },

            async signOut(): Promise<{ error: boolean; message?: string }> {
                set({ loading: true, error: null });

                try {
                    const company = useAppStore.getState().company;
                    const agentState = useAppStore.getState().actualStateAgent;
                    const extension = useAppStore.getState().extension;
                    const user = get().user;

                    const { data, status } = await getApiService(
                        "pxtalkApi2",
                        "private",
                        user.token
                    ).post("/painel-agents/logoutV2", {
                        accountcode: company.accountcode,
                        registernumber: extension.registernumber,
                        extennumber: agentState.extension,

                        agent: {
                            login: user.login,
                            password: user.password,
                        },

                        correlation_type_id: user.correlation_type_id,
                    });
                    if (status !== 200 || !data)
                        throw new Error("Dados inválidos retornados pela API.");

                    set({ error: null });
                    return { error: false };
                } catch (err: any) {
                    
                    const m =
                        err?.details?.message ||
                        err?.response?.data?.message ||
                        err?.message ||
                        "Erro desconhecido.";

                    return { error: true, message: m };
                } finally {
                    set({ loading: false });
                }
            },

            clear: () => {
                set({
                    isAuthenticated: false,
                    user: null,
                    userFirebase: null,
                    loading: false,
                    isLoading: false,
                    error: null,
                });

                localStorage.removeItem("auth-storage");
            },
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                user: state.user,
                userFirebase: state.userFirebase,
            }),
        }
    )
);
