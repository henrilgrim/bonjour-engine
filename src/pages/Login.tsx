import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, User, Eye, EyeOff } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { useToast } from "@/hooks/use-toast"
import { loginInRTDB } from "@/lib/firebase/realtime/online"

export default function LoginPage() {
	const navigate = useNavigate()
	const { toast } = useToast()

	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [showPassword, setShowPassword] = useState(false)
	const [formData, setFormData] = useState({ login: "", password: "" })
	const [mounted, setMounted] = useState(false)

	useEffect(() => { setMounted(true) }, [])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target
		setFormData((prev) => ({ ...prev, [id]: value }))
	}

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault()
		if (!formData.login || !formData.password) return

		setIsLoading(true)
		setError(null)

		try {
			const { error, message } = await useAuthStore.getState().login({ login: formData.login.trim(), password: formData.password })
			if (!error) {
				const user = useAuthStore.getState().user
				
				if (user) await loginInRTDB({ user })
				navigate("/agent-selection", { replace: true })
			}
			else toast({ variant: "destructive", title: "Erro ao fazer login", description: message || "Verifique suas credenciais e tente novamente." })
		} catch (err: any) {
			console.log(err)
			toast({ variant: "destructive", title: "Erro ao realizar login", description: err?.message || "Erro ao realizar login." })
		} finally {
			setIsLoading(false)
		}
	}

	if (!mounted) return null

	const canSubmit =
		formData.login.trim().length > 0 &&
		formData.password.length > 0 &&
		!isLoading

	return (
		<main className="min-h-screen flex items-center justify-center bg-background text-foreground">
			<Card className="w-full max-w-md shadow-xl border bg-card text-card-foreground">
				<CardHeader className="space-y-6 text-center">
					<div>
						<CardTitle className="text-2xl font-bold text-card-foreground">
							Login
						</CardTitle>
						<CardDescription className="text-muted-foreground">
							Entre com suas credenciais para acessar o sistema
						</CardDescription>
					</div>
				</CardHeader>

				<form onSubmit={handleSubmit} noValidate>
					<CardContent className="space-y-4">
						{/* Login */}
						<div className="space-y-2">
							<Label htmlFor="login" className="text-foreground">Login</Label>
							<div className="relative">
								<User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									id="login"
									name="login"
									placeholder="Seu login pxtalk"
									autoComplete="username"
									className="pl-10 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
									required
									value={formData.login}
									onChange={handleChange}
									disabled={isLoading}
								/>
							</div>
						</div>

						{/* Senha */}
						<div className="space-y-2">
							<Label htmlFor="password" className="text-foreground">Senha</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									placeholder="Sua senha"
									autoComplete="current-password"
									className="pl-10 pr-10 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
									required
									value={formData.password}
									onChange={handleChange}
									onKeyDown={(e) => {
										if (e.key === "Enter") e.currentTarget.form?.requestSubmit()
									}}
									disabled={isLoading}
								/>
								<button
									type="button"
									onClick={() => setShowPassword((prev) => !prev)}
									className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
									tabIndex={-1}
									aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
								>
									{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</div>
						</div>

						{error && <p className="text-sm text-red-500">{error}</p>}
					</CardContent>

					<CardFooter>
						<Button
							type="submit"
							className="w-full bg-yellow-400 text-black hover:bg-yellow-500 transition-all duration-200"
							disabled={!canSubmit}
						>
							{isLoading ? "ENTRANDO..." : "ENTRAR"}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</main>
	)
}