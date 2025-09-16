import React, { useState } from "react"
import { Maximize, Minimize, Sun, Moon, ArrowLeftRight, Monitor, LogOut, ChevronDown, Shield, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useLogout } from "@/hooks/api"
import { useUiTheme } from "@/contexts/ui-theme"
import { useAuthStore } from "@/store/authStore"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import VersionCheckButton from "@/components/layout/VersionCheckButton"

interface HeaderProps {
	title: string
	description: string
	icon: React.ReactNode

	isGodPanel?: boolean
	showToggleTvMode?: boolean
	showToggleFullscreen?: boolean
	showChangeDashboard?: boolean
}

export default function Header({ title, description, icon, showToggleTvMode = false, showChangeDashboard = false, showToggleFullscreen = false, isGodPanel = false }: HeaderProps) {
	const { isDark, toggleTheme, isMonitorMode, toggleMonitorMode, isFullscreen, toggleFullscreen } = useUiTheme()
	const navigate = useNavigate()
	const { logout } = useLogout()
	const [loading, setLoading] = useState(false)

	const user = useAuthStore((s) => s.user)
	const displayName = user?.nome || "Usuário"

	const initials = React.useMemo(() => {
		const parts = String(displayName).trim().split(/\s+/).filter(Boolean)
		if (parts.length === 0) return "U"
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
	}, [displayName])

	const handleLogout = async () => {
		setLoading(true)
		try {
			await logout()
			navigate("/login")
		} catch (error) {
			console.error("Logout error:", error)
			await logout()
			navigate("/login")
		} finally {
			setLoading(false)
		}
	}

	const handleChangeDashboard = () => {
		navigate("/select-dash")
		localStorage.removeItem("monitoring-dash-store")
	}

	return (
		<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 lg:mb-8 gap-4">
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-3">
					{isGodPanel ? (
						<Button variant="outline" size="sm" onClick={() => navigate('/select-dash')}>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Voltar
						</Button>
					) : (
						<div>{icon}</div>
					)}

					<div>
						<h1 className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--ring))] bg-clip-text text-transparent">
							{title}
						</h1>
						<p className="text-sm lg:text-base text-muted-foreground">{description}</p>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2 lg:gap-4 flex-wrap">
				{/* Modo TV */}
				{showToggleTvMode && (
					<Button variant={isMonitorMode ? "default" : "outline"} size="sm" className="flex items-center gap-2" onClick={toggleMonitorMode} aria-pressed={isMonitorMode} aria-label={isMonitorMode ? "Desativar modo TV" : "Ativar modo TV"} title={isMonitorMode ? "Modo TV ativado" : "Ativar modo TV"}>
						<Monitor className="w-4 h-4" />
						Modo TV
					</Button>
				)}

				{/* Tema */}
				<Button variant="outline" size="sm" className="flex items-center gap-2" onClick={toggleTheme} aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"} title={isDark ? "Tema claro" : "Tema escuro"}>
					{isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
					{isDark ? "Tema claro" : "Tema escuro"}
				</Button>

				{/* Fullscreen */}
				{showToggleFullscreen && (
					<Button variant="outline" size="sm" className="flex items-center gap-2" onClick={toggleFullscreen} aria-label={isFullscreen ? "Sair de tela cheia" : "Ir para tela cheia"}>
						{isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
						{isFullscreen ? "Sair de tela cheia" : "Tela cheia"}
					</Button>
				)}

				{/* Trocar dashboard */}
				{showChangeDashboard && (
					<Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleChangeDashboard} aria-label="Trocar de dashboard">
						<ArrowLeftRight className="w-4 h-4" />
						Trocar dashboard
					</Button>
				)}

				{/* Menu do usuário (substitui o botão Sair) */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="flex items-center gap-2" aria-label="Abrir menu do usuário">
							<div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
								{initials}
							</div>
							<span className="max-w-[140px] truncate">{displayName}</span>
							<ChevronDown className="h-4 w-4 opacity-70" />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end" className="w-64">
						<DropdownMenuLabel className="flex items-center gap-2">
							<div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold">
								{initials}
							</div>
							<div className="min-w-0">
								<div className="truncate text-sm font-medium">{displayName}</div>
							</div>
						</DropdownMenuLabel>

						<DropdownMenuSeparator />

						{/* Área compacta para checar atualização */}
						<div className="px-2 py-1.5 flex items-center justify-between">
							<span className="text-xs text-muted-foreground">Atualização</span>
							<VersionCheckButton />
						</div>

						<DropdownMenuSeparator />

						{/* Sair */}
						<DropdownMenuItem
							onSelect={(e) => {
								e.preventDefault()
								if (!loading) handleLogout()
							}}
							className="text-destructive focus:text-destructive"
						>
							<LogOut className="mr-2 h-4 w-4" />
							<span>{loading ? "Saindo…" : "Sair"}</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

			</div>
		</div>
	)
}
