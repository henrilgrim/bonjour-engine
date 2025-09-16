/**
 * API Types
 * 
 * Define todos os tipos relacionados às APIs do sistema.
 * Centraliza interfaces de request/response para manter consistência.
 */

import { User } from '@/types/user'

// ============= BASE TYPES =============

/**
 * Resposta padrão das APIs
 */
export interface BaseApiResponse<T = any> {
	data?: T
	dados?: T  // Compatibilidade com API atual
	error?: boolean
	message?: string
	status?: number
}

/**
 * Parâmetros de paginação
 */
export interface PaginationParams {
	page?: number
	limit?: number
	offset?: number
}

/**
 * Resposta paginada
 */
export interface PaginatedResponse<T> {
	data: T[]
	total: number
	page: number
	limit: number
	hasNext: boolean
	hasPrev: boolean
}

// ============= AUTH API TYPES =============

/**
 * Request de login
 */
export interface LoginRequest {
	app_id?: string
	login: string
	senha?: string
	password?: string
}

/**
 * Response de login do serviço de autenticação
 */
export interface ServiceLoginResponse {
	dados: {
		usuario: {
			_id: string
			nome: string
			login: string
			empresa_id: string
			empresa_nome: string
			type: string
			empresaConf?: {
				pbx?: {
					accountcode: string
				}
			}
		}
		token: string
	}
	error?: boolean
}

/**
 * Response de login do PxTalk
 */
export interface PxTalkLoginResponse {
	token: string
	error?: boolean
}

// ============= DASHBOARD TYPES =============

/**
 * Estados de configuração do dashboard
 */
export interface DashboardEstados {
	alerta: string
	critico: string
}

/**
 * Configuração de fila
 */
export interface FilaConfig {
	estados?: DashboardEstados
	fila_importante?: boolean
}

/**
 * Dashboard completo
 */
export interface DashboardData {
	id?: string
	accountcode: string
	nome: string
	descricao?: string
	thema?: "dark" | "light" | "dark-high-contrast" | "light-high-contrast"
	configuracao?: { estados?: DashboardEstados }
	filas?: Array<{
		id: string
		configuracao?: FilaConfig
		totalizadores?: any
		queueMemberStatus?: any[]
	}>
	visible: boolean
}

// ============= QUEUE TYPES =============

/**
 * Status de fila em tempo real
 */
export interface QueueRealtimeData {
	id: string
	data: {
		queue: string
		totalAgents?: number
		busyAgents?: number
		availableAgents?: number
		queueSize?: number
		[key: string]: any
	}
}

/**
 * Totalizadores de fila
 */
export interface QueueTotalizadores {
	queue: string
	media_tma: number
	media_tme: number
	recebidas_abandonadas_na_fila: number
	recebidas_atendidas_na_fila: number
}

// ============= MONITORING TYPES =============

/**
 * Configuração de alertas
 */
export interface AlertConfig {
	id?: string
	accountcode: string
	soundEnabled: boolean
	soundMode?: "siren" | "beep"
	repeatSoundMs?: number
	webhookEnabled?: boolean
	repeatWebhookMs?: number
	webhook: {
		method: "GET" | "POST"
		url: string
		headersText?: string
		contentType?: string
		body?: string
	}
	visible?: boolean
}

// ============= API HOOK TYPES =============

/**
 * Estado padrão de hooks de API
 */
export interface ApiHookState<T> {
	data: T | null
	loading: boolean
	error: string | null
	refetch: () => void
}

/**
 * Opções para hooks de API
 */
export interface ApiHookOptions {
	enabled?: boolean
	refetchOnWindowFocus?: boolean
	refetchInterval?: number
	onSuccess?: (data: any) => void
	onError?: (error: string) => void
}

/**
 * Parâmetros para hooks de mutação
 */
export interface MutationHookOptions<TData, TVariables> {
	onSuccess?: (data: TData, variables: TVariables) => void
	onError?: (error: string, variables: TVariables) => void
	onSettled?: (data: TData | null, error: string | null, variables: TVariables) => void
}