import React, { useMemo, useState } from "react";
import {
    Sun,
    Moon,
    LogOut,
    ChevronDown,
    Monitor,
    Activity,
    Settings,
    Users,
    BarChart3,
    ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useLogout } from "@/hooks/use-logout";
import { useUiTheme } from "@/contexts/ui-theme";
import { useAuthStore } from "@/store/authStore";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import VersionCheckButton from "@/components/layout/VersionCheckButton";

interface HeaderProps {}

const ROUTE_CONFIG: Record<
    string,
    { title: string; description: string; icon: React.ElementType }
> = {
    "/": {
        title: "Gestão de Operadores",
        description: "Dashboard para supervisão de operadores",
        icon: Monitor,
    },
    "/settings": {
        title: "Configurações",
        description: "Ajuste preferências da sua conta e do sistema",
        icon: Settings,
    },
    "/agent-selection": {
        title: "Seleção de Agentes",
        description:
            "Escolha os agentes que você deseja monitorar. Apenas as pausas e atividades desses agentes serão exibidas no sistema.",
        icon: Users,
    },
};

export default function Header({}: HeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark, toggleTheme } = useUiTheme();
    const { logout } = useLogout();
    const [loading, setLoading] = useState(false);

    const user = useAuthStore((s) => s.user);
    const displayName = user?.nome || "Usuário";

    const headerData = useMemo(() => {
        const config = ROUTE_CONFIG[location.pathname];
        if (config) return config;
        return {
            title: "Painel PxTalk",
            description: "Gerencie seu sistema de forma simples e rápida",
            icon: Monitor,
        };
    }, [location.pathname]);

    const initials = useMemo(() => {
        const parts = String(displayName).trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return "U";
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }, [displayName]);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            await logout();
            navigate("/login");
        } finally {
            setLoading(false);
        }
    };

    const isHome = location.pathname === "/home";
    const isSettings = location.pathname === "/settings";

    return (
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 lg:mb-8 gap-4">
            {/* Esquerda: Ícone + Títulos */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                    <headerData.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {headerData.title}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {headerData.description}
                    </p>
                </div>
            </div>

            {/* Direita: Ações */}
            <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
                {isHome && (
                    <>
                        {/* Status tempo real */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Activity className="w-4 h-4" />
                            <span>Tempo real</span>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        </div>


                        {/* Botão Tema */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={toggleTheme}
                            aria-label={
                                isDark
                                    ? "Ativar tema claro"
                                    : "Ativar tema escuro"
                            }
                            title={isDark ? "Tema claro" : "Tema escuro"}
                        >
                            {isDark ? (
                                <Sun className="w-4 h-4" />
                            ) : (
                                <Moon className="w-4 h-4" />
                            )}
                            {isDark ? "Tema claro" : "Tema escuro"}
                        </Button>
                    </>
                )}

                {isSettings && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => navigate("/")}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Home
                    </Button>
                )}

                {/* Menu Usuário */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            aria-label="Abrir menu do usuário"
                        >
                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                                {initials}
                            </div>
                            <span className="max-w-[140px] truncate">
                                {displayName}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-70" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <div className="truncate text-sm font-medium">
                                    {displayName}
                                </div>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        {/* Atualização */}
                        <div className="px-2 py-1.5 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Atualização
                            </span>
                            <VersionCheckButton />
                        </div>

                        <DropdownMenuSeparator />

                        {/* Configurações */}
                        <DropdownMenuItem
                            onSelect={() => navigate("/settings")}
                            className="cursor-pointer"
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Configurações</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Sair */}
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault();
                                if (!loading) handleLogout();
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
    );
}
