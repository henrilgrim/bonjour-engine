/**
 * API Hooks Index
 * 
 * Exporta todos os hooks de API para facilitar importação.
 * Organize imports por categoria para melhor organização.
 */

// ============= AUTH HOOKS =============
export { useLogout } from './useAuth'

/**
 * Convenções de Nomenclatura:
 * 
 * - useXxx: Hooks de leitura (GET)
 * - useCreateXxx: Hooks de criação (POST)
 * - useUpdateXxx: Hooks de atualização (PUT/PATCH)
 * - useDeleteXxx: Hooks de deleção (DELETE)
 * - useRealtimeXxx: Hooks de tempo real (WebSocket/Firebase)
 * 
 * Estados Comuns:
 * - loading/isLoading: Indica operação em andamento
 * - error: Mensagem de erro ou null
 * - data: Dados retornados pela API
 * - refetch/refresh: Função para recarregar dados
 * 
 * Padrões de Retorno:
 * - Hooks de leitura: { data, loading, error, refetch }
 * - Hooks de mutação: { mutate, isLoading, error, reset }
 * - Hooks de tempo real: { data, connected, error, disconnect }
 */