import React, { useState } from "react";
import { Sun, Moon, LogOut, Settings, Home, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useLogout } from "@/hooks/use-logout";
import { useUiTheme } from "@/contexts/ui-theme";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";

import logo_light from "@/assets/logo-light.png";
import logo_dark from "@/assets/logo-dark.png";
import favicon from "@/assets/favicon.png";
import { clearAllFirebaseListeners } from "@/lib/firebase/listeners";
import { AgentStatusCard } from "./AgentStatusCard";
import { useVersionCheck } from "@/hooks/use-version-check";
import { useAuthStore } from "@/store/authStore";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Users, Clock } from "lucide-react";

const menuItems = [
    { title: "Início", url: "/home", icon: Home },
    { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { open: sidebarOpen } = useSidebar();
    const { isDark, toggleTheme } = useUiTheme();
    const { logout } = useLogout();
    const [loading, setLoading] = useState(false);
    const user = useAuthStore((s) => s.user);

    const logoSrc = isDark ? logo_light : logo_dark;
    const isActive = (path: string) => location.pathname === path;

    const {
        loading: loadingCheck,
        message,
        hasUpdate,
        commit,
        checkVersion,
    } = useVersionCheck();

    const handleClick = async () => {
        await checkVersion();
        if (hasUpdate && confirm("Nova versão detectada. Atualizar agora?")) {
            window.location.reload();
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            clearAllFirebaseListeners();
            navigate("/login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sidebar
            className={`transition-all duration-300 z-40 ${
                sidebarOpen ? "w-64" : "w-20"
            }`}
            collapsible="none"
        >
            <SidebarContent className="flex flex-col h-full bg-gradient-to-b from-sidebar-background/95 to-sidebar-background/90 backdrop-blur-xl border-r border-sidebar-border/60 shadow-soft">
                {/* LOGO */}
                <div className="flex items-center justify-center p-6 border-b border-sidebar-border/30">
                    <img
                        src={sidebarOpen ? logoSrc : favicon}
                        alt="Painel do Gestor"
                        className={`transition-all duration-500 ${
                            sidebarOpen ? "w-40 h-auto" : "w-8 h-8"
                        } filter drop-shadow-sm`}
                    />
                </div>

                {/* AGENT INFO */}
                <div className="px-4 py-6 border-b border-sidebar-border/30 space-y-4">
                    {sidebarOpen ? (
                        <>
                            {/* User Info - Expanded */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 backdrop-blur-sm border border-primary/10 rounded-xl">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                                    <span className="text-sm font-bold text-primary">
                                        {user?.name?.charAt(0) || "U"}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-foreground truncate">
                                        {user?.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Ramal:{" "}
                                        <span className="font-mono font-medium text-primary">
                                            {user?.extension}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Agent Status Cards */}
                            <AgentStatusCard />
                        </>
                    ) : (
                        <>
                            {/* User Avatar - Collapsed */}
                            <div className="flex justify-center">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20">
                                    <span className="text-lg font-bold text-primary">
                                        {user?.name?.charAt(0) || "U"}
                                    </span>
                                </div>
                            </div>

                            {/* Compact Status Indicators */}
                            <div className="flex flex-col items-center gap-2">
                                {/* Queue Status Indicator */}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-surface-elevated/80 to-surface-elevated/60 border border-glass-border flex items-center justify-center cursor-help hover:scale-105 transition-transform">
                                                <Users className="h-5 w-5 text-primary" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="right"
                                            className="z-50 bg-popover/95 backdrop-blur-sm border border-border/50 shadow-xl"
                                        >
                                            <p className="font-semibold text-sm">
                                                Filas de Atendimento
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Clique no menu para ver detalhes
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                {/* Pause Status Indicator */}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-warning/10 to-warning/20 border border-warning/30 flex items-center justify-center cursor-help hover:scale-105 transition-transform">
                                                <Clock className="h-5 w-5 text-warning" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="right"
                                            className="z-50 bg-popover/95 backdrop-blur-sm border border-border/50 shadow-xl"
                                        >
                                            <p className="font-semibold text-sm">
                                                Status da Equipe
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Expanda o menu para ver quantos
                                                colegas estão em pausa
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </>
                    )}
                </div>

                {/* MENU */}
                <SidebarGroup className="flex-1 px-4">
                    <SidebarGroupContent>
                        <SidebarMenu
                            className={`${
                                sidebarOpen
                                    ? "space-y-2"
                                    : "space-y-3 items-center"
                            }`}
                        >
                            {menuItems.map((item) => {
                                const isCurrent = isActive(item.url);
                                return (
                                    <SidebarMenuItem
                                        key={item.title}
                                        className={
                                            sidebarOpen
                                                ? ""
                                                : "flex justify-center"
                                        }
                                    >
                                        <SidebarMenuButton
                                            onClick={() => navigate(item.url)}
                                            isActive={isCurrent}
                                            className={`group transition-all duration-300 ${
                                                sidebarOpen
                                                    ? "w-full justify-start gap-4 px-4 py-3 rounded-xl h-auto"
                                                    : "w-14 h-14 p-0 justify-center rounded-xl"
                                            } ${
                                                isCurrent
                                                    ? "bg-gradient-to-r from-primary/15 to-primary/10 text-primary font-semibold shadow-soft border border-primary/20"
                                                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-gradient-to-r hover:from-sidebar-accent/60 hover:to-sidebar-accent/40 hover:shadow-soft border border-transparent hover:border-sidebar-border/30"
                                            }`}
                                            title={
                                                !sidebarOpen
                                                    ? item.title
                                                    : undefined
                                            }
                                        >
                                            <item.icon
                                                className={`shrink-0 transition-transform duration-300 ${
                                                    isCurrent
                                                        ? "scale-110"
                                                        : "group-hover:scale-105"
                                                } ${
                                                    sidebarOpen
                                                        ? "h-5 w-5"
                                                        : "h-6 w-6"
                                                }`}
                                            />
                                            {sidebarOpen && (
                                                <span className="text-sm font-medium">
                                                    {item.title}
                                                </span>
                                            )}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* FOOTER */}
                <div className="p-4 border-t border-sidebar-border/30 mt-auto bg-gradient-to-t from-sidebar-background/50 to-transparent">
                    {sidebarOpen ? (
                        <div className="flex flex-col gap-2">
                            {/* Tema */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleTheme}
                                className="w-full justify-start gap-4 px-4 py-3 rounded-xl hover:bg-sidebar-accent/60 transition-all duration-300 group"
                            >
                                {isDark ? (
                                    <Sun className="h-5 w-5 shrink-0 text-warning group-hover:scale-110 transition-transform" />
                                ) : (
                                    <Moon className="h-5 w-5 shrink-0 text-primary group-hover:scale-110 transition-transform" />
                                )}
                                <span className="text-sm font-medium">
                                    {isDark ? "Tema claro" : "Tema escuro"}
                                </span>
                            </Button>

                            {/* Versão */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClick}
                                disabled={loadingCheck}
                                className={`w-full justify-start gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                                    hasUpdate
                                        ? "text-success hover:bg-success/10"
                                        : "hover:bg-sidebar-accent/60"
                                }`}
                                title={
                                    commit ? `Commit: ${commit}` : "Sem commit"
                                }
                                aria-busy={loadingCheck}
                            >
                                <RefreshCcw
                                    className={`h-5 w-5 shrink-0 group-hover:scale-110 transition-transform ${
                                        loadingCheck ? "animate-spin" : ""
                                    } ${hasUpdate ? "text-success" : ""}`}
                                />
                                <span className="text-sm font-medium">
                                    {loadingCheck
                                        ? "Checando versão…"
                                        : hasUpdate
                                        ? "Nova versão disponível"
                                        : "Checar atualização"}
                                </span>
                            </Button>

                            {/* Logout */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                disabled={loading}
                                className="w-full justify-start gap-4 px-4 py-3 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300 group"
                            >
                                <LogOut className="h-5 w-5 shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">
                                    {loading ? "Saindo..." : "Sair"}
                                </span>
                            </Button>

                            {/* Powered by */}
                            <div className="text-xs text-muted-foreground text-center pt-3 mt-2 border-t border-sidebar-border/20">
                                <span className="opacity-60">Powered by</span>{" "}
                                <span className="font-bold text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text">
                                    PxTalk
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                title={isDark ? "Tema claro" : "Tema escuro"}
                                className="w-14 h-14 rounded-xl hover:bg-sidebar-accent/60 transition-all duration-300 group"
                            >
                                {isDark ? (
                                    <Sun className="h-6 w-6 text-warning group-hover:scale-110 transition-transform" />
                                ) : (
                                    <Moon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                                )}
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleClick}
                                disabled={loadingCheck}
                                aria-busy={loadingCheck}
                                title={message || "Checar versão"}
                                className={`w-14 h-14 rounded-xl transition-all duration-300 group ${
                                    hasUpdate
                                        ? "text-success hover:bg-success/10"
                                        : "hover:bg-sidebar-accent/60"
                                }`}
                            >
                                <RefreshCcw
                                    className={`h-6 w-6 group-hover:scale-110 transition-transform ${
                                        loadingCheck ? "animate-spin" : ""
                                    } ${hasUpdate ? "text-success" : ""}`}
                                />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                disabled={loading}
                                className="w-14 h-14 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300 group"
                                title="Sair"
                            >
                                <LogOut className="h-6 w-6 group-hover:scale-110 transition-transform" />
                            </Button>
                        </div>
                    )}
                </div>
            </SidebarContent>
        </Sidebar>
    );
}
