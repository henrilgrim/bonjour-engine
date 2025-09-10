/**
 * API Services
 * 
 * Centraliza todas as instâncias de API do sistema
 * organizadas por serviço/domínio.
 */

import { createPublicApiInstance, createPrivateApiInstance } from './base'

// URLs das APIs (usando variáveis de ambiente)
const API_URL_PXTALK = import.meta.env.VITE_API_URL_PXTALK || ""
const API_URL_02 = import.meta.env.VITE_API_URL_PXTALK_02 || ""
const API_URL_PXTALK_02 = import.meta.env.VITE_API_URL_PXTALK_03 || ""
const SERVICE_LOGIN = import.meta.env.VITE_API_URL_PXTALK_SERVICE_LOGIN || ""

/**
 * Serviço de Login/Autenticação
 */
export const AuthApiService = {
	/**
	 * Instância pública para login
	 */
	public: () => createPublicApiInstance(SERVICE_LOGIN),

	/**
	 * Instância privada para operações autenticadas
	 */
	private: (token: string) => createPrivateApiInstance(SERVICE_LOGIN, token),
}

/**
 * Serviço PxTalk (API Principal)
 */
export const PxTalkApiService = {
	/**
	 * Instância pública (API v2)
	 */
	public: () => createPublicApiInstance(API_URL_02),

	/**
	 * Instância privada (API v2)
	 */
	private: (token: string) => createPrivateApiInstance(API_URL_02, token),

	/**
	 * Instância pública (API v1)
	 */
	publicV1: () => createPublicApiInstance(API_URL_PXTALK),

	/**
	 * Instância privada (API v1)
	 */
	privateV1: (token: string) => createPrivateApiInstance(API_URL_PXTALK, token),

	/**
	 * Instância pública (API v3)
	 */
	publicV3: () => createPublicApiInstance(API_URL_PXTALK_02),

	/**
	 * Instância privada (API v3)
	 */
	privateV3: (token: string) => createPrivateApiInstance(API_URL_PXTALK_02, token),
}

/**
 * Tipos para uso nos hooks
 */
export type ApiServiceType = 'auth' | 'pxtalk' | 'pxtalkApi2' | 'pxtalkApi3'
export type ApiMode = 'public' | 'private'

/**
 * Factory para criar instâncias de API
 * 
 * private: https://service.56k.com.br/api/loginServer
 * pxtalk: https://api-doc.pxtalk.com.br/api
 * pxtalkApi2: https://painel-api2.pxtalk.com.br/api
 * pxtalkApi3: https://api.pxtalk.com.br
 */
export function getApiService(service: ApiServiceType, mode: ApiMode = 'public', token?: string) {
	switch (service) {
		case 'auth':
			return mode === 'private' && token
				? AuthApiService.private(token)
				: AuthApiService.public()

		case 'pxtalk':
			return mode === 'private' && token
				? PxTalkApiService.private(token)
				: PxTalkApiService.public()

		case 'pxtalkApi2':
			return mode === 'private' && token
				? PxTalkApiService.privateV1(token)
				: PxTalkApiService.publicV1()

		case 'pxtalkApi3':
			return mode === 'private' && token
				? PxTalkApiService.privateV3(token)
				: PxTalkApiService.publicV3()

		default:
			throw new Error(`Serviço desconhecido: ${service}`)
	}
}