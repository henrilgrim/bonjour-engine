import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import {
    upsertProfileConfiguration,
    getProfileConfiguration,
} from "@/lib/firebase/firestore/profiles";
import { playAlert, type AlertType } from "@/lib/sfx/alerts";

interface NotificationsConfig {
    messageNotifications: boolean;
    pauseNotifications: boolean;
    systemNotifications: boolean;
    soundType: string;
    volume: number; // Novo campo para controle de volume (0-100)
}

const DEFAULT_CONFIG: NotificationsConfig = {
    messageNotifications: true,
    pauseNotifications: true,
    systemNotifications: true,
    soundType: "notification", // Som único para todas as notificações
    volume: 10, // Volume padrão de 10%
};

export function useNotificationsConfig() {
    const [config, setConfig] = useState<NotificationsConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { userFirebase } = useAuthStore();
    const { company } = useAppStore();

    // Cache local das configurações
    const localConfigRef = useRef<NotificationsConfig | null>(null);

    const getNotificationsConfig =
        useCallback(async (): Promise<NotificationsConfig> => {
            if (!company?.accountcode || !userFirebase?.userId) {
                // Tenta carregar do localStorage se não estiver autenticado
                const localConfig = localStorage.getItem(
                    "notifications-config"
                );
                if (localConfig) {
                    try {
                        return {
                            ...DEFAULT_CONFIG,
                            ...JSON.parse(localConfig),
                        };
                    } catch {
                        return DEFAULT_CONFIG;
                    }
                }
                return DEFAULT_CONFIG;
            }

            try {
                const configData = await getProfileConfiguration(
                    company.accountcode,
                    userFirebase.userId,
                    "notifications"
                );
                const remoteConfig = {
                    ...DEFAULT_CONFIG,
                    ...((configData?.value as Partial<NotificationsConfig>) ||
                        {}),
                };

                // Salva no localStorage para persistir localmente
                localStorage.setItem(
                    "notifications-config",
                    JSON.stringify(remoteConfig)
                );

                return remoteConfig;
            } catch (error) {
                console.error(
                    "Erro ao buscar configuração de notificações:",
                    error
                );

                // Fallback para localStorage
                const localConfig = localStorage.getItem(
                    "notifications-config"
                );
                if (localConfig) {
                    try {
                        return {
                            ...DEFAULT_CONFIG,
                            ...JSON.parse(localConfig),
                        };
                    } catch {
                        return DEFAULT_CONFIG;
                    }
                }

                return DEFAULT_CONFIG;
            }
        }, [company?.accountcode, userFirebase?.userId]);

    const saveNotificationsConfig = useCallback(
        async (newConfig: Partial<NotificationsConfig>) => {
            setSaving(true);
            try {
                const updatedConfig = { ...config, ...newConfig };

                // Sempre salva no localStorage primeiro
                localStorage.setItem(
                    "notifications-config",
                    JSON.stringify(updatedConfig)
                );
                setConfig(updatedConfig);
                localConfigRef.current = updatedConfig;

                // Tenta salvar no Firestore se autenticado
                if (company?.accountcode && userFirebase?.userId) {
                    await upsertProfileConfiguration(
                        company.accountcode,
                        userFirebase.userId,
                        "notifications",
                        updatedConfig,
                        userFirebase.name || "sistema"
                    );
                }
            } catch (error) {
                console.error(
                    "Erro ao salvar configuração de notificações:",
                    error
                );
                throw error;
            } finally {
                setSaving(false);
            }
        },
        [company?.accountcode, userFirebase?.userId, userFirebase?.name, config]
    );

    const updateMessageNotifications = useCallback(
        async (enabled: boolean) => {
            await saveNotificationsConfig({ messageNotifications: enabled });
        },
        [saveNotificationsConfig]
    );

    const updatePauseNotifications = useCallback(
        async (enabled: boolean) => {
            await saveNotificationsConfig({ pauseNotifications: enabled });
        },
        [saveNotificationsConfig]
    );

    const updateSystemNotifications = useCallback(
        async (enabled: boolean) => {
            await saveNotificationsConfig({ systemNotifications: enabled });
        },
        [saveNotificationsConfig]
    );

    const updateSoundType = useCallback(
        async (soundType: string) => {
            await saveNotificationsConfig({ soundType });
        },
        [saveNotificationsConfig]
    );

    // Nova função para atualizar volume
    const updateVolume = useCallback(
        async (volume: number) => {
            const clampedVolume = Math.max(0, Math.min(100, volume));
            await saveNotificationsConfig({ volume: clampedVolume });
        },
        [saveNotificationsConfig]
    );

    // Função para tocar som baseado na configuração com controle de volume
    const playNotificationSound = useCallback(
        (
            type:
                | "message"
                | "pause"
                | "system"
                | "breakExceeded"
                | "warning" = "message"
        ) => {
            try {
                // Verifica se o tipo de notificação está habilitado
                const isTypeEnabled =
                    (type === "message" && config.messageNotifications) ||
                    (type === "pause" && config.pauseNotifications) ||
                    (type === "system" && config.systemNotifications) ||
                    (type === "breakExceeded" && config.pauseNotifications) ||
                    (type === "warning" && config.pauseNotifications);

                if (!isTypeEnabled) {
                    return;
                }

                // Converte volume de 0-100 para 0-1
                const normalizedVolume = config.volume / 100;


                // Sempre usa o mesmo som de notificação
                playAlert("soft", { volume: normalizedVolume });
            } catch (error) {
                console.error("Erro ao reproduzir som de notificação:", error);
            }
        },
        [config]
    );

    // Carrega configurações ao inicializar ou quando autenticação muda
    useEffect(() => {
        const loadConfig = async () => {
            setLoading(true);
            try {
                const loadedConfig = await getNotificationsConfig();
                setConfig(loadedConfig);
                localConfigRef.current = loadedConfig;
            } catch (error) {
                console.error(
                    "Erro ao carregar configurações de notificações:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
    }, [getNotificationsConfig]);

    // Memoiza as configurações para evitar re-renders desnecessários
    const memoizedConfig = useMemo(() => config, [config]);

    return {
        config: memoizedConfig,
        loading,
        saving,
        saveNotificationsConfig,
        updateMessageNotifications,
        updatePauseNotifications,
        updateSystemNotifications,
        updateSoundType,
        updateVolume, // Nova função exportada
        playNotificationSound,

        // Propriedades individuais para facilitar o uso
        messageNotifications: memoizedConfig.messageNotifications,
        pauseNotifications: memoizedConfig.pauseNotifications,
        systemNotifications: memoizedConfig.systemNotifications,
        soundType: memoizedConfig.soundType,
        volume: memoizedConfig.volume, // Nova propriedade exportada

        // Função para verificar se um tipo está habilitado
        isEnabled: useCallback(
            (type: "message" | "pause" | "system") => {
                switch (type) {
                    case "message":
                        return memoizedConfig.messageNotifications;
                    case "pause":
                        return memoizedConfig.pauseNotifications;
                    case "system":
                        return memoizedConfig.systemNotifications;
                    default:
                        return true;
                }
            },
            [memoizedConfig]
        ),
    };
}
