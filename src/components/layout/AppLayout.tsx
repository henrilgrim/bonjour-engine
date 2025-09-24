import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { FirebaseNotificationDisplay } from "@/components/notifications/FirebaseNotificationDisplay";
import { StatsHeader } from "./StatsHeader";

import { useTableStore } from "@/store/tableStore";
import { useReasonStore } from "@/store/reasonStore";
import { Softphone } from "../softphone";
import { useSoftphone } from "@/hooks/use-softphone";
import { useAppStore } from "@/store/appStore";
import { useForceActions } from "@/hooks/use-force-actions";

export default function AppLayout() {
    const { pathname } = useLocation();
    const { tickets, reasonsData } = useTableStore();
    const { reasons: allReasonsMetadata } = useReasonStore();
    const { setConfig } = useSoftphone();
    const softphoneEnabled = useAppStore((s) => s.softphoneEnabled);

    // Hook para escutar ações forçadas do supervisor
    useForceActions();

    const isSidebarVisible = useMemo(
        () => pathname.startsWith("/home"),
        [pathname]
    );

    const totalBreakSeconds = useMemo(
        () =>
            reasonsData.reduce((acc, r) => acc + (r.durationInSeconds ?? 0), 0),
        [reasonsData]
    );

    const averageBreakTime = useMemo(
        () =>
            reasonsData.length > 0 ? totalBreakSeconds / reasonsData.length : 0,
        [reasonsData, totalBreakSeconds]
    );

    // Initialize softphone (you can set this based on user settings)
    useEffect(() => {
        // Enable softphone by default - you can change this logic
        setConfig({
            enabled: true, // Change to false to disable
            sipServer: "sip.example.com",
            username: "user123",
            password: "password123",
        });
    }, [setConfig]);

    return (
        <SidebarProvider>
            <div className="flex w-full min-h-screen">
                <AppSidebar />

                <div className="flex flex-col flex-1 min-h-screen">
                    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 p-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <SidebarTrigger />
                            {isSidebarVisible && (
                                <StatsHeader
                                    totalCalls={tickets.pagination.total}
                                    totalBreaks={totalBreakSeconds}
                                    averageTime={averageBreakTime}
                                    reasons={reasonsData}
                                    allReasonsMetadata={allReasonsMetadata}
                                />
                            )}
                        </div>
                    </header>

                    <main className="flex-1 flex flex-col xl:flex-row gap-4 p-4 relative">
                        <div
                            className={`${
                                softphoneEnabled
                                    ? "flex-1 xl:flex-[3]"
                                    : "flex-1"
                            } ${softphoneEnabled ? "xl:pr-4" : ""}`}
                        >
                            <Outlet />
                        </div>

                        {softphoneEnabled && (
                            <div className="w-full xl:w-96 xl:flex-shrink-0 relative">
                                <div className="sticky top-4 h-full">
                                    <div className="bg-card/50 backdrop-blur-sm border border-glass-border rounded-xl shadow-soft hover:shadow-glow transition-all duration-300 h-full">
                                        <Softphone />
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>

                <FirebaseNotificationDisplay />
            </div>
        </SidebarProvider>
    );
}
