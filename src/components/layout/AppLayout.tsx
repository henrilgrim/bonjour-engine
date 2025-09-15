import { Outlet, useLocation } from "react-router-dom"
import Header from "@/components/layout/Header"
import { useCoreStore } from "@/store/coreStore"

export default function AppLayout() {
    const { pathname } = useLocation()
    const isHeaderVisible = useCoreStore((s) => s.isHeaderVisible)

    const cfg = (() => {
        if (pathname.startsWith("/home")) return { visible: true, showToggleFullscreen: true }
        return { visible: true, showToggleFullscreen: false }
    })()

    return (
        <div className="min-h-screen">
            {cfg.visible && isHeaderVisible && (
                <div className="px-4 md:px-6 pt-4 md:pt-6">
                    <Header />
                </div>
            )}

            <main className="px-4 md:px-6">
                <Outlet />
            </main>
        </div>
    )
}
