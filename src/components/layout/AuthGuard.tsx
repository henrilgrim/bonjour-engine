
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useTableStore } from '@/store/tableStore'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
	children: React.ReactNode
	requireAuth?: boolean
	redirectTo?: string
}

export default function AuthGuard({ children, requireAuth = true, redirectTo }: AuthGuardProps) {
	const navigate = useNavigate()
	const { isAuthenticated, loading, user } = useAuthStore()
	const { setActive } = useTableStore()

	useEffect(() => {
		if (loading) return

		// Se precisa de auth mas não está autenticado, redireciona para login
		if (requireAuth && !isAuthenticated) {
			// Desativa o tableStore se não está autenticado
			setActive(false)
			navigate(redirectTo || '/login', { replace: true })
			return
		}

		// Se não precisa de auth mas está autenticado, redireciona para home
		if (!requireAuth && isAuthenticated && user) {
			navigate(redirectTo || '/home', { replace: true })
			return
		}

		// Se está em uma rota que requer autenticação e está autenticado, ativa o tableStore
		if (requireAuth && isAuthenticated) {
			setActive(true)
		}
	}, [isAuthenticated, loading, requireAuth, redirectTo, navigate, user, setActive])

	// Mostra loading enquanto está verificando auth
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<p className="text-sm text-muted-foreground">Verificando autenticação...</p>
				</div>
			</div>
		)
	}

	// Se precisa de auth mas não está autenticado, não renderiza nada (vai redirecionar)
	if (requireAuth && !isAuthenticated) {
		return null
	}

	// Se não precisa de auth mas está autenticado, não renderiza nada (vai redirecionar)
	if (!requireAuth && isAuthenticated && user) {
		return null
	}

	return <>{children}</>
}
