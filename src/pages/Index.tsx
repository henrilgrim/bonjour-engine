import { useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"

export default function HomePage() {
	const { isAuthenticated } = useAuthStore()
	const navigate = useNavigate()
	const location = useLocation()
	const redirected = useRef(false)

	useEffect(() => {
		if (isAuthenticated === undefined) return
		if (redirected.current) return

		const target = isAuthenticated ? "/home" : "/login"
		
		if (location.pathname !== target) {
			redirected.current = true
			navigate(target, { replace: true })
		}
	}, [isAuthenticated, location.pathname, navigate])

	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary border-solid" />
		</div>
	)
}
