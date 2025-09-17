import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";
import HomePage from "./pages/Home";
import SettingsPage from "./pages/Settings";
import NotificationsPage from "./pages/Notifications";
import AuthGuard from "./components/auth/AuthGuard";
import DevToolsProtection from "./config/devtools-protection";
import { UiThemeProvider } from "@/contexts/ui-theme";
import AppLayout from "@/components/layout/AppLayout";
import AppUpdateWatcher from "./components/system/AppUpdateWatcher";


const queryClient = new QueryClient();

export default function App() {
    return (
        <UiThemeProvider>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <DevToolsProtection
                        requiredKey="PX_SECRET"
                        requiredValue="diogenes_sinope"
                    />
                    <Toaster />
                    <Sonner />
                    <AppUpdateWatcher />
                    

                    <BrowserRouter
                        future={{
                            v7_startTransition: true,
                            v7_relativeSplatPath: true,
                        }}
                    >
                        <Routes>
                            {/* Rotas SEM header */}
                            <Route path="/" element={<Index />} />
                            <Route
                                path="/login"
                                element={
                                    <AuthGuard requireAuth={false}>
                                        <LoginPage />
                                    </AuthGuard>
                                }
                            />

                            {/* Rotas COM header (dentro do layout) */}
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
                                <Route
                                    path="/notifications"
                                    element={
                                        <AuthGuard requireAuth={true}>
                                            <NotificationsPage />
                                        </AuthGuard>
                                    }
                                />
                            </Route>

                            {/* 404 */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </BrowserRouter>
                </TooltipProvider>
            </QueryClientProvider>
        </UiThemeProvider>
    );
}
