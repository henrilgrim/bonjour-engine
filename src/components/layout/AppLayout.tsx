import { Outlet, useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useGlobalChatListener } from "@/hooks/use-global-chat-listener";

type cfgProps = {
    visible?: boolean;
};

export default function AppLayout() {
    const { pathname } = useLocation();

    // Ativa o listener global de notificações de mensagens
    useGlobalChatListener();

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
        <div className="flex flex-col min-h-screen">
            {cfg.visible && (
                <header className="sticky top-0 z-50 w-full bg-background shadow-md px-6 py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <Header />
                </header>
            )}

            {/* Conteúdo principal ocupa o restante */}
            <main className="flex-1 w-full">
                <Outlet />
            </main>
        </div>
    );
}
