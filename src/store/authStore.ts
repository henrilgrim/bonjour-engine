import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { getApiService } from "@/lib/api/services"
import { Company, mapCompany } from "@/types/company"
import { loginInRTDB } from "@/lib/firebase/realtime/online"

export type User = {
	id: string
	nome: string
	login: string
	empresa_id: string
	empresa_nome: string
	accountcode: string
	type: string
	token_pxtalk: string
	token_service: string
}

interface AuthState {
	isAuthenticated: boolean
	user: User | null
	company: Company | null
	loading: boolean
	isLoading: boolean
	error: string | null
	tvMode: boolean
	login: (credentials: { login: string; password: string }) => Promise<{ error: boolean, message?: string }>
	clear: () => void
	clearError: () => void
	toggleTvMode: () => void
}

export function isMonitorEnabled(e?: Company) {
	let isPermitted: boolean

	if (!e) isPermitted = false
	else if (e.blocked) isPermitted = false
	else if (!e.painel_monitor_enabled) isPermitted = false
	else isPermitted = true

	return isPermitted
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			isAuthenticated: false,
			user: null,
			company: null,
			loading: false,
			isLoading: false,
			error: null,
			tvMode: false,

			async login({ login, password }) {
				set({ loading: true, isLoading: true, error: null })

				try {
					const { data: serviceLogin } = await getApiService('auth', 'public').post("/login", { app_id: '5e3c0ae79363a015375d6ff1', login, senha: password })
					if (!serviceLogin || serviceLogin.error || !serviceLogin.dados?.usuario) {
						set({ isAuthenticated: false, user: null })
						return { error: true, message: serviceLogin?.message || "Erro no login do serviço" }
					}

					const { data: pxtalkLogin } = await getApiService('pxtalk', 'public').post("/users/authenticate", { login, password })
					if (!pxtalkLogin || pxtalkLogin.error || !pxtalkLogin.token) {
						set({ isAuthenticated: false, user: null })
						return { error: true, message: pxtalkLogin?.message || "Erro no login PxTalk" }
					}

					const usuario = serviceLogin.dados.usuario
					const token_service = serviceLogin.dados.token?.replace(/^bearer\s+/i, "") || ""
					const token_pxtalk = pxtalkLogin.token?.replace(/^bearer\s+/i, "") || ""

					const { data: meData } = await getApiService('pxtalkV1', 'private', token_service).get("/companies/me")
					if (!meData || meData.error || !meData.company) {
						set({ isAuthenticated: false, user: null })
						return { error: true, message: meData?.message || "Erro ao obter dados da empresa" }
					}

					const empresa = mapCompany(meData.company) as Company
					if (!isMonitorEnabled(empresa)) {
						set({ isAuthenticated: false, user: null })
						return { error: true, message: "Painel de monitoramento não habilitado" }
					}

					const accountcode: string = (empresa as any)?.accountcode ?? usuario?.empresaConf?.pbx?.accountcode ?? ""

					set({
						isAuthenticated: true,
						user: {
							id: String(usuario._id),
							nome: usuario.nome,
							login: usuario.login,
							empresa_id: String(usuario.empresa_id),
							empresa_nome: usuario.empresa_nome,
							accountcode,
							type: usuario.type,
							token_service,
							token_pxtalk,
						},
						company: empresa,
						error: null,
					})

					return { error: false }
				} catch (err: any) {
					set({
						isAuthenticated: false,
						user: null,
						error: err?.message || "Erro desconhecido",
					})
					return { error: true, message: err?.message || "Erro desconhecido" }
				} finally {
					set({ loading: false, isLoading: false })
				}
			},

			clear: () => {
				set({ isAuthenticated: false, user: null, company: null, loading: false, isLoading: false, error: null })
			},

			clearError: () => {
				set({ error: null })
			},

			toggleTvMode: () => {
				set({ tvMode: !get().tvMode })
			},
		}),
		{
			name: "auth-storage",
			storage: createJSONStorage(() => localStorage),
		}
	)
)

// Hook customizado para acessar dados do usuário atual
export const useCurrentUser = () => {
	return useAuthStore(state => state.user)
}
