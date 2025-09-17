import React, { useMemo, useState } from "react";
import {
    Sun,
    Moon,
    LogOut,
    ChevronDown,
    Monitor,
    Activity,
    Settings,
    Bell,
    Home,
    Users,
} from "lucide-react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
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
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    useSidebar,
} from "@/components/ui/sidebar";
import VersionCheckButton from "@/components/layout/VersionCheckButton";

import logo_dark from "../../assets/logo-dark.png";
import logo_ligth from "../../assets/logo-ligth.png";
import logo_favicon from "../../assets/favicon.png";

const navigationItems = [
    {
        title: "Home",
        url: "/home",
        icon: Home,
        description: "Dashboard principal",
    },
    {
        title: "Configurações",
        url: "/settings",
        icon: Settings,
        description: "Configurações do sistema",
    },
    {
        title: "Notificações",
        url: "/notifications",
        icon: Bell,
        description: "Central de notificações",
    },
];

export default function AppSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark, toggleTheme } = useUiTheme();
    const { logout } = useLogout();
    const [loading, setLoading] = useState(false);
    const { state } = useSidebar();

    const isCollapsed = state === "collapsed";
    const isActive = (path: string) => location.pathname === path;

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

    const logo_resolved = isDark ? logo_dark : logo_ligth;

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center justify-center w-full py-4">
                    <img
                        src={isCollapsed ? logo_favicon : logo_resolved}
                        alt="Logo"
                        className={`transition-all duration-200 ${
                            isCollapsed ? "w-8 h-8" : "w-32 h-auto"
                        }`}
                    />
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navegação</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="flex flex-col gap-2 px-1">
                            {navigationItems.map((item) => (
                                <SidebarMenuItem key={item.url}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.url)}
                                        tooltip={
                                            isCollapsed ? item.title : undefined
                                        }
                                        className={`
                    relative z-[9999] transition-all duration-200
                    hover:bg-muted hover:text-foreground
                    data-[active=true]:bg-primary/10 data-[active=true]:text-primary
                    px-3 py-2 rounded-md
                `}
                                    >
                                        <NavLink
                                            to={item.url}
                                            className="flex items-center gap-3 w-full text-sm font-medium"
                                        >
                                            <item.icon className="w-5 h-5 shrink-0" />
                                            <span className="truncate">
                                                {item.title}
                                            </span>
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="flex flex-col gap-2">
                {/* Theme Toggle */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={toggleTheme}
                            tooltip={
                                isCollapsed
                                    ? isDark
                                        ? "Tema claro"
                                        : "Tema escuro"
                                    : undefined
                            }
                            className="relative z-30"
                        >
                            {isDark ? (
                                <Sun className="w-4 h-4" />
                            ) : (
                                <Moon className="w-4 h-4" />
                            )}
                            <span>{isDark ? "Tema claro" : "Tema escuro"}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* Logout */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleLogout}
                            className="text-destructive hover:bg-destructive/10"
                            tooltip={isCollapsed ? "Sair" : undefined}
                        >
                            <LogOut className="w-4 h-4" />
                            <span>{loading ? "Saindo…" : "Sair"}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
