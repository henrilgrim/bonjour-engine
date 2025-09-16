import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
	children: React.ReactNode
	requireAuth?: boolean
	redirectTo?: string
}

export default function AuthGuard({ children, requireAuth = true, redirectTo }: AuthGuardProps) {
	const navigate = useNavigate()
	const { isAuthenticated, loading } = useAuthStore()

	useEffect(() => {
		if (loading) return
		if (requireAuth && !isAuthenticated) navigate(redirectTo || '/login', { replace: true })
		else if (!requireAuth && isAuthenticated) navigate(redirectTo || '/select-dash', { replace: true })
	}, [isAuthenticated, loading, requireAuth, redirectTo, navigate])

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

	if (requireAuth && !isAuthenticated) return null
	if (!requireAuth && isAuthenticated) return null
	return <>{children}</>
}