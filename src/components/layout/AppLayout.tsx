import { Outlet, useLocation } from "react-router-dom";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import { useCoreStore } from "@/store/coreStore";
import StatsToggleButton from "./StatsToggleButton";

export default function AppLayout() {
    const { pathname } = useLocation();
    const isSidebarVisible = useCoreStore((s) => s.isHeaderVisible); // Reutilizando a mesma lógica

    const showSidebar = (() => {
        if (pathname.startsWith("/home")) return true;
        if (pathname.startsWith("/settings")) return true;
        if (pathname.startsWith("/notifications")) return true;
        return false;
    })();

    if (!showSidebar) {
        return (
            <div className="min-h-screen">
                <main className="px-4 md:px-6">
                    <Outlet />
                </main>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                {isSidebarVisible && <AppSidebar />}
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />

                            {/* Botão de estatísticas aqui */}
                            <StatsToggleButton />
                        </div>
                    </header>

                    <main className="flex-1 px-4 md:px-6">
                        <Outlet />
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
