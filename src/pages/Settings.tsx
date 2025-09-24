import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLogout } from "@/hooks/use-logout";
import { useNotificationsConfig } from "@/hooks/use-notifications-config";
import { ChevronLeft, Settings2 } from "lucide-react";
import CardReset from "@/components/settings/CardReset";
import CardNotification from "@/components/settings/CardNotification";
import StatusBar from "@/components/settings/StatusBar";

interface LocalNotificationsConfig {
    messageNotifications: boolean;
    pauseNotifications: boolean;
    systemNotifications: boolean;
    soundType: string;
    volume: number;
}

export default function Settings() {
    const [isClearing, setIsClearing] = useState(false);
    const { toast } = useToast();
    const { logout } = useLogout();
    const navigate = useNavigate();

    const {
        messageNotifications,
        pauseNotifications,
        systemNotifications,
        soundType,
        volume,
        loading: notificationsLoading,
        saving: notificationsSaving,
        saveNotificationsConfig,
    } = useNotificationsConfig();

    // Estado local das configurações
    const [localConfig, setLocalConfig] = useState<LocalNotificationsConfig>({
        messageNotifications: messageNotifications || false,
        pauseNotifications: pauseNotifications || false,
        systemNotifications: systemNotifications || false,
        soundType: soundType || "soft",
        volume: volume || 50,
    });

    // Verifica se há mudanças não salvas
    const hasUnsavedChanges = useMemo(() => {
        return (
            localConfig.messageNotifications !== messageNotifications ||
            localConfig.pauseNotifications !== pauseNotifications ||
            localConfig.systemNotifications !== systemNotifications ||
            localConfig.soundType !== soundType ||
            localConfig.volume !== volume
        );
    }, [
        localConfig,
        messageNotifications,
        pauseNotifications,
        systemNotifications,
        soundType,
        volume,
    ]);

    // Sincroniza estado local com o global quando carrega
    useEffect(() => {
        setLocalConfig({
            messageNotifications: messageNotifications || false,
            pauseNotifications: pauseNotifications || false,
            systemNotifications: systemNotifications || false,
            soundType: soundType || "soft",
            volume: volume || 50,
        });
    }, [
        messageNotifications,
        pauseNotifications,
        systemNotifications,
        soundType,
        volume,
    ]);

    const notifPermission: NotificationPermission | "unsupported" =
        useMemo(() => {
            if (typeof window === "undefined" || !("Notification" in window))
                return "unsupported";
            return Notification.permission;
        }, []);

    const isBusy = notificationsLoading || notificationsSaving;

    const handleLocalConfigChange = (
        key: keyof LocalNotificationsConfig,
        value: boolean | string | number
    ) => {
        setLocalConfig((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const clearAllBrowserData = async () => {
        setIsClearing(true);
        try {
            localStorage.clear();
            sessionStorage.clear();

            if ("indexedDB" in window) {
                try {
                    const databases = await indexedDB.databases();
                    for (const db of databases) {
                        if (db.name) indexedDB.deleteDatabase(db.name);
                    }
                } catch (error) {
                    console.warn("Erro ao limpar IndexedDB:", error);
                }
            }

            await logout({ keepAnonymous: false });

            toast({
                title: "Dados limpos com sucesso",
                description: "A aplicação será recarregada em instantes.",
                variant: "success",
            });

            setTimeout(() => {
                window.location.href = "/";
            }, 1500);
        } catch (error) {
            console.error("Erro ao limpar dados:", error);
            toast({
                title: "Erro ao limpar dados",
                description: "Tente novamente em instantes.",
                variant: "destructive",
            });
        } finally {
            setIsClearing(false);
        }
    };

    const requestNotifPermission = async () => {
        if (!("Notification" in window)) return;
        try {
            await Notification.requestPermission();
            window.location.reload();
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        document.title = "Configurações · PX";
    }, []);

    return (
        <div className="max-w-8xl mx-auto px-4 py-6 space-y-6">
            {/* STATUS BAR */}
            <StatusBar
                notifPermission={notifPermission}
                isBusy={isBusy}
                hasUnsavedChanges={hasUnsavedChanges}
                requestNotifPermission={requestNotifPermission}
            />

            {/* GRID */}
            <div className="grid gap-6 md:grid-cols-1">
                {/* RESET */}
                <CardReset
                    isClearing={isClearing}
                    clearAllBrowserData={clearAllBrowserData}
                />
            </div>
        </div>
    );
}
