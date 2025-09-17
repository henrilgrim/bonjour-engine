import { useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Compass, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
	const location = useLocation()
	const navigate = useNavigate()

	useEffect(() => { console.error("404 Error: User attempted to access non-existent route:", location.pathname) }, [location.pathname])

	return (
		<div className="min-h-screen flex items-center justify-center px-4 md:px-6 py-10 bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--muted))]">
			<div className="w-full max-w-xl rounded-2xl border bg-card text-card-foreground shadow-sm p-8 text-center">
				<div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
					<Compass className="h-7 w-7 text-primary" />
				</div>

				<h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--ring))] bg-clip-text text-transparent">
					404
				</h1>

				<p className="mt-2 text-sm text-muted-foreground">
					Oops! Página não encontrada.
				</p>

				<div className="mt-3 text-xs text-muted-foreground">
					Rota solicitada:{" "}
					<code className="rounded bg-muted px-1 py-0.5">{location.pathname}</code>
				</div>

				<div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
					<Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
						<ArrowLeft className="h-4 w-4" />
						Voltar
					</Button>

					<Button asChild className="gap-2">
						<Link to="/">
							<Home className="h-4 w-4" />
							Início
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
