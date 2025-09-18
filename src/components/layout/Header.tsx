import React, { useState } from "react";
import {
    Sun,
    Moon,
    LogOut,
    ChevronDown,
    Settings,
    Home,
    RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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
import VersionCheckButton from "@/components/system/VersionCheckButton";

import logo_light from "@/assets/logo-light.png";
import logo_dark from "@/assets/logo-dark.png";
import { clearAllFirebaseListeners } from "@/lib/firebase/listeners";
import { AgentQueuesInfo } from "./AgentQueuesInfo";

type HeaderProps = {};

export default function Header({}: HeaderProps) {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useUiTheme();

    const { logout } = useLogout();
    const [loading, setLoading] = useState(false);

    const user = useAuthStore((s) => s.user);
    const displayName = user?.name || "Usuário";

    const logoSrc = isDark ? logo_light : logo_dark;

    const initials = React.useMemo(() => {
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
            clearAllFirebaseListeners();
        } catch (error) {
            console.error("Logout error:", error);
            await logout();
            navigate("/login");
        } finally {
            setLoading(false);
        }
    };

    const routesWithoutSignOut = [
        { label: "Início", icon: Home, action: () => navigate("/home") },
        // { label: "Produtividade", icon: BarChart3, action: () => navigate("/analytics") },
        {
            label: "Configuração",
            icon: Settings,
            action: () => navigate("/settings"),
        },
    ];

    return (
        <>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <img
                        src={logoSrc}
                        alt="Painel do Agente"
                        className="h-20 w-auto object-contain"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
                <AgentQueuesInfo />

                {/* Tema */}
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={toggleTheme}
                    aria-label={
                        isDark ? "Ativar tema claro" : "Ativar tema escuro"
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

                {/* Menu do usuário (substitui o botão Sair) */}
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

                        {/* Área compacta para checar atualização */}
                        <div className="px-2 py-1.5 flex flex-col  justify-between">
                            <span className="text-xs text-muted-foreground">
                                Atualização
                            </span>
                            <VersionCheckButton />
                        </div>

                        <DropdownMenuSeparator />

                        {/* Configuração */}
                        {routesWithoutSignOut.map((route) => (
                            <div key={route.label}>
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        route.action();
                                    }}
                                >
                                    <route.icon className="mr-2 h-4 w-4" />
                                    <span>{route.label}</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                            </div>
                        ))}

                        {/* Sair */}
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault();
                                if (!loading) handleLogout();
                            }}
                            className="text-destructive focus:text-destructive cursor-pointer"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>{loading ? "Saindo…" : "Sair"}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    );
}
