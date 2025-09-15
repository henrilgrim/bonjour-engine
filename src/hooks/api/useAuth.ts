import { useState, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useQueuesStore } from '@/store/queuesStore'
import { logoutInRTDB } from '@/lib/firebase/realtime/online'

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
	const queuesStore = useQueuesStore()
	const user = authStore.user

	const logout = useCallback(async (opts?: { keepAnonymous?: boolean }) => {
		setIsLoading(true)

		try {
			authStore.clear()
			queuesStore.clear()
			await logoutInRTDB({ user_id: user.id, accountcode: user.accountcode })
		} catch (error) {
			console.error('Logout error:', error)

			authStore.clear()
			queuesStore.clear()
			try { await logoutInRTDB({ user_id: user.id, accountcode: user.accountcode }) } catch { }
		} finally {
			setIsLoading(false)
		}
	}, [authStore])

	return {
		logout,
		isLoading,
	}
}