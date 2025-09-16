/**
 * Hooks de Autenticação
 * 
 * Hooks customizados para operações de autenticação com APIs.
 * Integra com o Zustand store para gerenciamento de estado.
 */

import { useState, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useMonitoringDashStore } from '@/store/monitoringDashStore'
import { useQueuesStore } from '@/store/queuesStore'
import { logoutFirebase } from '@/lib/firebase/functions/auth'
import { clearAllListeners } from '@/lib/firebase/listeners-manager'

/**
 * Hook para logout do usuário
 * 
 * @example
 * ```tsx
 * const { logout, isLoading } = useLogout()
 * 
 * const handleLogout = async () => {
 *   await logout()
 *   // Usuário deslogado
 * }
 * ```
 */
export function useLogout() {
	const [isLoading, setIsLoading] = useState(false)
	const authStore = useAuthStore()
	const monitoringDashStore = useMonitoringDashStore()
	const queuesStore = useQueuesStore()

	const logout = useCallback(async () => {
		setIsLoading(true)
		try {
			// Remove todos os listeners Firebase primeiro
			clearAllListeners()
			
			await logoutFirebase({ keepAnonymous: false })

			authStore.clear()
			monitoringDashStore.clear()
			queuesStore.clear()
		} catch (error) {
			console.error('Logout error:', error)

			// Mesmo com erro, limpa os stores e listeners
			clearAllListeners()
			authStore.clear()
			monitoringDashStore.clear()
			queuesStore.clear()
		} finally {
			setIsLoading(false)
		}
	}, [authStore, monitoringDashStore, queuesStore])

	return { logout, isLoading }
}