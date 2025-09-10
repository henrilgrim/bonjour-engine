/**
 * Base API Configuration
 *
 * Este arquivo centraliza a configuração das APIs do sistema.
 * Inclui interceptors para tratamento de erros, autenticação e logging.
 */

import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    AxiosError,
} from "axios";

// Types para respostas da API
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    error?: boolean;
    status: number;
}

export interface ApiError {
    message: string;
    status?: number;
    code?: string;
    details?: any;
}

/**
 * Configuração base para todas as APIs
 */
const DEFAULT_CONFIG: AxiosRequestConfig = {
    timeout: 30000, // 30 segundos
    headers: {
        "Content-Type": "application/json",
    },
};

/**
 * Cria uma instância do Axios com configurações padrão
 */
export function createApiInstance(
    baseURL: string,
    config?: AxiosRequestConfig
): AxiosInstance {
    const instance = axios.create({
        ...DEFAULT_CONFIG,
        baseURL,
        ...config,
    });

    // Request interceptor - adiciona tokens de autenticação
    instance.interceptors.request.use(
        (config) => {
            // Log da requisição em desenvolvimento
            // if (process.env.NODE_ENV === 'development') {
            // 	console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
            // }
            return config;
        },
        (error) => {
            console.error("❌ Request Error:", error);
            return Promise.reject(error);
        }
    );

    // Response interceptor - trata respostas e erros
    instance.interceptors.response.use(
        (response: AxiosResponse) => {
            // Log da resposta em desenvolvimento
            // if (process.env.NODE_ENV === 'development') {
            // 	console.log(`✅ API Response: ${response.status} ${response.config.url}`)
            // }
            return response;
        },
        (error: AxiosError) => {
            const apiError: ApiError = {
                message: "Erro na comunicação com o servidor",
                status: error.response?.status,
                code: error.code,
                details: error.response?.data,
            };

            // Trata erros específicos
            if (error.response?.status === 401) {
                apiError.message =
                    "Acesso não autorizado. Faça login novamente.";
                // Aqui você pode disparar logout automático
            } else if (error.response?.status === 403) {
                apiError.message =
                    "Você não tem permissão para acessar este recurso.";
            } else if (error.response?.status === 404) {
                apiError.message = "Recurso não encontrado.";
            } else if (error.response?.status === 500) {
                apiError.message =
                    "Erro interno do servidor. Tente novamente mais tarde.";
            } else if (error.code === "ECONNABORTED") {
                apiError.message = "Tempo limite da requisição excedido.";
            } else if (error.message === "Network Error") {
                apiError.message = "Erro de conexão. Verifique sua internet.";
            }

            console.error("❌ API Error:", apiError);
            return Promise.reject(apiError);
        }
    );

    return instance;
}

/**
 * Cria instância pública (sem autenticação)
 */
export function createPublicApiInstance(baseURL: string): AxiosInstance {
    return createApiInstance(baseURL);
}

/**
 * Cria instância privada (com autenticação)
 */
export function createPrivateApiInstance(
    baseURL: string,
    token: string
): AxiosInstance {
    return createApiInstance(baseURL, {
        headers: {
            Authorization: token.startsWith("Bearer ")
                ? token
                : `bearer ${token}`,
        },
    });
}

/**
 * Wrapper para tratamento de erros consistente
 */
export async function apiCall<T = any>(
    promise: Promise<AxiosResponse<T>>
): Promise<ApiResponse<T>> {
    try {
        const response = await promise;
        return {
            data: response.data,
            status: response.status,
            error: false,
        };
    } catch (error) {
        const apiError = error as ApiError;
        return {
            data: null as T,
            message: apiError.message,
            status: apiError.status || 500,
            error: true,
        };
    }
}
