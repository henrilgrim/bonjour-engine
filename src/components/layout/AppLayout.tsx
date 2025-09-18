import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { FirebaseNotificationDisplay } from "@/components/notifications/FirebaseNotificationDisplay";

type cfgProps = {
    visible?: boolean;
};

export default function AppLayout() {
    const { pathname } = useLocation();

    const cfg: cfgProps = (() => {
        if (pathname.startsWith("/home"))
            return {
                visible: true,
            };
        return {
            visible: true,
        };
    })();

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                {cfg.visible && <AppSidebar />}
                
                <div className="flex-1 flex flex-col min-h-screen">
                    {cfg.visible && (
                        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 p-2">
                            <SidebarTrigger />
                        </div>
                    )}

                    {/* Conteúdo principal ocupa o restante */}
                    <main className="flex-1">
                        <Outlet />
                    </main>
                </div>

                {/* Notificações do Firebase */}
                <FirebaseNotificationDisplay />
            </div>
        </SidebarProvider>
    );
}
