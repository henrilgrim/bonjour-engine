import { useEffect } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    useLocation,
    Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UiThemeProvider } from "@/contexts/ui-theme";
import { NotificationDisplay } from "@/components/notifications/NotificationDisplay";

import AuthGuard from "@/components/layout/AuthGuard";
import AppUpdateWatcher from "@/components/system/AppUpdateWatcher";

import AppLayout from "@/components/layout/AppLayout";

import LoginPage from "@/pages/Login";
import HomePage from "@/pages/Home";
import SettingsPage from "@/pages/Settings";
import CompanyErrorPage from "@/pages/CompanyErrorPage";
import NotFound from "@/pages/NotFound";

import { useAppStore } from "@/store/appStore";


const queryClient = new QueryClient();

function AppRoutesWrapper() {
    const location = useLocation();

    const setCode = useAppStore((s) => s.setCode);
    const setCompany = useAppStore((s) => s.setCompany);
    const checkCompanyCode = useAppStore((s) => s.checkCompanyCode);
    const hasFetchedCompany = useAppStore((s) => s.hasFetchedCompany);
    const company = useAppStore((s) => s.company);


    useEffect(() => {
        const codeFromLocalStorage = localStorage.getItem("code");
        const params = new URLSearchParams(location.search);
        const codeFromUrl = params.get("id");

        let code = codeFromUrl || codeFromLocalStorage;

        if (code && (!hasFetchedCompany || !company)) {
            setCode(code);

            checkCompanyCode(code)
                .then((res) => {
                    if (res?.company) {
                        setCompany(res.company);
                    } else {
                        console.warn(
                            "Código de empresa inválido:",
                            res?.message
                        );
                    }
                })
                .catch((err) => {
                    console.error("Erro ao verificar código de empresa:", err);
                });
        }
    }, [
        location.search,
        hasFetchedCompany,
        company,
        setCode,
        setCompany,
        checkCompanyCode,
    ]);

    return (
        <>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route
                    path="/login"
                    element={
                        <AuthGuard requireAuth={false}>
                            <LoginPage />
                        </AuthGuard>
                    }
                />

                <Route element={<AppLayout />}>
                    <Route
                        path="/home"
                        element={
                            <AuthGuard requireAuth={true}>
                                <HomePage />
                            </AuthGuard>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <AuthGuard requireAuth={true}>
                                <SettingsPage />
                            </AuthGuard>
                        }
                    />
                </Route>

                <Route
                    path="/company-not-found"
                    element={<CompanyErrorPage />}
                />
                <Route path="*" element={<NotFound />} />
            </Routes>

            {/* Componentes globais */}
            <AppUpdateWatcher />

            {/* Sistema de notificações in-app */}
            <NotificationDisplay />
        </>
    );
}

export default function App() {
    return (
        <UiThemeProvider>
            <TooltipProvider>
                <QueryClientProvider client={queryClient}>
                    <BrowserRouter
                        future={{
                            v7_startTransition: true,
                            v7_relativeSplatPath: true,
                        }}
                    >
                        <AppRoutesWrapper />
                    </BrowserRouter>
                    <Toaster />
                    <Sonner theme="system" />
                </QueryClientProvider>
            </TooltipProvider>
        </UiThemeProvider>
    );
}
