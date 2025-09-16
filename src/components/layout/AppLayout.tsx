import { Outlet, useLocation } from "react-router-dom"
import Header from "@/components/layout/Header"
import { Monitor, MonitorCog } from "lucide-react"
import { useMonitoringDashStore } from "@/store/monitoringDashStore"

export default function AppLayout() {
    const { pathname } = useLocation()
    const { dashSelected } = useMonitoringDashStore()

    const cfg = (() => {
        if (pathname.startsWith("/home")) {
            return {
                visible: true,
                title: dashSelected?.nome || "Dashboard",
                description: dashSelected?.descricao || "Monitoramento de filas e agentes",
                icon: <Monitor className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />,
                showToggleTvMode: true,
                showToggleFullscreen: true,
                showChangeDashboard: true,
                isGodPanel: false,
            }
        }

        if (pathname.startsWith("/select-dash")) {
            return {
                visible: true,
                title: "Selecionar Dashboard",
                description: "Selecione um dashboard existente ou crie um novo para monitorar suas filas.",
                icon: <MonitorCog className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />,
                showToggleTvMode: false,
                showToggleFullscreen: false,
                showChangeDashboard: false,
                isGodPanel: false,
            }
        }

        if (pathname.startsWith("/god-panel")) {
            return {
                visible: true,
                title: "Painel God",
                description: "Gerenciar usuários com acesso administrativo",
                icon: <MonitorCog className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />,
                showToggleTvMode: false,
                showToggleFullscreen: false,
                showChangeDashboard: false,
                isGodPanel: true,
            }
        }

        return {
            visible: true,
            title: "App",
            description: "",
            icon: <Monitor className="w-6 h-6 text-primary" />,
            showToggleTvMode: false,
            showToggleFullscreen: false,
            showChangeDashboard: false,
            isGodPanel: false,
        }
    })()

    // Layout padrão de tela + container (mantém padrão visual)
    return (
        <div className="min-h-screen">
            {cfg.visible && (
                <div className="px-4 md:px-6 pt-4 md:pt-6">
                    <Header
                        title={cfg.title}
                        description={cfg.description}
                        icon={cfg.icon}
                        showToggleTvMode={cfg.showToggleTvMode}
                        showToggleFullscreen={cfg.showToggleFullscreen}
                        showChangeDashboard={cfg.showChangeDashboard}
                        isGodPanel={cfg.isGodPanel}
                    />
                </div>
            )}

            {/* Área de conteúdo das páginas */}
            <main className="px-4 md:px-6 pb-6">
                <Outlet />
            </main>
        </div>
    )
}
