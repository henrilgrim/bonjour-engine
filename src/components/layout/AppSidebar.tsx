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
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar";
import VersionCheckButton from "@/components/system/VersionCheckButton";

import logo_light from "@/assets/logo-light.png";
import logo_dark from "@/assets/logo-dark.png";
import { clearAllFirebaseListeners } from "@/lib/firebase/listeners";
import { AgentQueuesInfo } from "./AgentQueuesInfo";

const menuItems = [
    { title: "Início", url: "/home", icon: Home },
    { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { open: sidebarOpen, setOpen } = useSidebar();
    const { isDark, toggleTheme } = useUiTheme();
    const { logout } = useLogout();
    const [loading, setLoading] = useState(false);

    const user = useAuthStore((s) => s.user);
    const displayName = user?.name || "Usuário";
    const logoSrc = isDark ? logo_light : logo_dark;

    const currentPath = location.pathname;
    const isActive = (path: string) => currentPath === path;
    const getNavCls = ({ isActive }: { isActive: boolean }) =>
        isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

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

    return (
        <Sidebar className={!sidebarOpen ? "w-16" : "w-64"} collapsible="icon">
            <SidebarContent className="gap-0">
                {/* Logo Section */}
                <div className="p-4 border-b">
                    <div className="flex items-center justify-center">
                        <img
                            src={logoSrc}
                            alt="Painel do Agente"
                            className={`object-contain transition-all duration-300 ${
                                !sidebarOpen ? "h-8 w-8" : "h-16 w-auto"
                            }`}
                        />
                    </div>
                </div>

                {/* Agent Queues Info */}
                {sidebarOpen && (
                    <div className="p-4 border-b">
                        <AgentQueuesInfo />
                    </div>
                )}

                {/* Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel>Navegação</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        className={getNavCls({
                                            isActive: isActive(item.url),
                                        })}
                                    >
                                        <a
                                            href={item.url}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigate(item.url);
                                            }}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {sidebarOpen && (
                                                <span>{item.title}</span>
                                            )}
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Theme Toggle */}
                <div className="p-4 border-t mt-auto">
                    <Button
                        variant="outline"
                        size={!sidebarOpen ? "icon" : "sm"}
                        className="w-full flex items-center gap-2"
                        onClick={toggleTheme}
                        title={isDark ? "Tema claro" : "Tema escuro"}
                    >
                        {isDark ? (
                            <Sun className="w-4 h-4" />
                        ) : (
                            <Moon className="w-4 h-4" />
                        )}
                        {sidebarOpen && (
                            <span>{isDark ? "Tema claro" : "Tema escuro"}</span>
                        )}
                    </Button>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size={!sidebarOpen ? "icon" : "sm"}
                                className="w-full mt-2 flex items-center gap-2"
                            >
                                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                                    {initials}
                                </div>
                                {sidebarOpen && (
                                    <>
                                        <span className="max-w-[100px] truncate">
                                            {displayName}
                                        </span>
                                        <ChevronDown className="h-4 w-4 opacity-70" />
                                    </>
                                )}
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align={!sidebarOpen ? "center" : "start"}
                            className="w-64"
                        >
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

                            <div className="px-2 py-1.5 flex flex-col justify-between">
                                <span className="text-xs text-muted-foreground">
                                    Atualização
                                </span>
                                <VersionCheckButton />
                            </div>

                            <DropdownMenuSeparator />

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
            </SidebarContent>
        </Sidebar>
    );
}