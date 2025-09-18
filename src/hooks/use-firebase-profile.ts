import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onSnapshot, serverTimestamp, doc } from "firebase/firestore";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";

import {
    getProfile as getProfileApi,
    createProfile as createProfileApi,
    updateProfile as updateProfileApi,
    getProfile,
    getProfileByUserId,
    getProfileDoc,
    ensureProfileDoc as ensureProfileDocApi,
    upsertProfileConfiguration as upsertProfileConfigurationApi,
    getProfileConfigurationsCollection,
    listProfileConfigurations as listProfileConfigurationsApi,
    upsertCallNote as upsertCallNoteApi,
    getCallNote as getCallNoteApi,
    deleteCallNote as deleteCallNoteApi,
} from "@/lib/firebase/firestore/profiles";

import type {
    Profile,
    ProfileConfiguration,
    CallNote,
} from "@/lib/firebase/firestore/profiles/types";

type UseFirebaseProfileOptions = {
    autoCreate?: boolean;
};

export function useFirebaseProfile(opts: UseFirebaseProfileOptions = {}) {
    const { autoCreate = true } = opts;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const [profile, setProfile] = useState<Profile | null>(null);
    const [configs, setConfigs] = useState<ProfileConfiguration[]>([]);

    // cancelamento de listeners
    const unsubProfileRef = useRef<() => void>();
    const unsubConfigsRef = useRef<() => void>();

    // stores
    // const user = useAuthStore((s) => s.user);
    const setUserFirebase = useAuthStore((s) => s.setUserFirebase);

    const defaultProfileId = useAuthStore(
        (s) => s.userFirebase?.userId || undefined
    );
    const userFirebase = useAuthStore((s) => s.userFirebase);
    const accountcode = useAppStore((s) => s.company?.accountcode);

    // id final do doc
    const profileId = useMemo(() => defaultProfileId, [defaultProfileId]);

    const ready = Boolean(accountcode && profileId);

    // Mapa de configs por chave (acesso O(1) em UI)
    const configMap = useMemo(() => {
        const m = new Map<string, unknown>();
        for (const c of configs) m.set(c.key, c.value);
        return m;
    }, [configs]);

    // cria o doc se necessário (usando sua ensureProfileDoc)
    const ensure = useCallback(async () => {
        if (!ready) return;
        try {
            await ensureProfileDocApi(accountcode!, profileId!, {
                userId: userFirebase?.userId ?? profileId!,
                name: userFirebase?.name || profileId!,
                createdBy: userFirebase?.userId,
                updatedBy: userFirebase?.userId,
                updatedAt: serverTimestamp() as any,
            } as Partial<Profile>);
        } catch (e) {
            setError(e as Error);
            throw e;
        }
    }, [
        ready,
        accountcode,
        profileId,
        userFirebase?.userId,
        userFirebase?.name,
    ]);

    // ações
    const updateProfile = useCallback(
        async (patch: Partial<Omit<Profile, "accountcode" | "createdAt">>) => {
            if (!ready)
                throw new Error("Parâmetros ausentes (accountcode/profileId)");
            setSaving(true);
            setError(null);
            try {
                await updateProfileApi(accountcode!, profileId!, {
                    ...patch,
                    updatedBy: userFirebase?.userId,
                } as any);
            } catch (e) {
                setError(e as Error);
                throw e;
            } finally {
                setSaving(false);
            }
        },
        [ready, accountcode, profileId, userFirebase?.userId]
    );

    const setConfig = useCallback(
        async (key: string, value: unknown) => {
            if (!ready)
                throw new Error("Parâmetros ausentes (accountcode/profileId)");
            setSaving(true);
            setError(null);
            try {
                await upsertProfileConfigurationApi(
                    accountcode!,
                    profileId!,
                    key,
                    value,
                    userFirebase?.userId
                );
            } catch (e) {
                setError(e as Error);
                throw e;
            } finally {
                setSaving(false);
            }
        },
        [ready, accountcode, profileId, userFirebase?.userId]
    );

    const removeConfig = useCallback(
        async (key: string) => {
            if (!ready)
                throw new Error("Parâmetros ausentes (accountcode/profileId)");
            setSaving(true);
            setError(null);
            try {
                // como você não expôs um remove específico, usamos deleteDoc dinâmico
                const { deleteDoc } = await import("firebase/firestore");
                const cfgRef = doc(
                    getProfileConfigurationsCollection(
                        accountcode!,
                        profileId!
                    ),
                    key
                );
                await deleteDoc(cfgRef);
            } catch (e) {
                setError(e as Error);
                throw e;
            } finally {
                setSaving(false);
            }
        },
        [ready, accountcode, profileId]
    );

    const setCallNote = useCallback(
        async (ticketId: string, notes: string) => {
            if (!ready)
                throw new Error("Parâmetros ausentes (accountcode/profileId)");
            setSaving(true);
            setError(null);
            try {
                await upsertCallNoteApi(
                    accountcode!,
                    userFirebase?.userId!,
                    ticketId,
                    notes,
                    userFirebase?.userId
                );
            } catch (e) {
                setError(e as Error);
                throw e;
            } finally {
                setSaving(false);
            }
        },
        [ready, accountcode, profileId, userFirebase?.userId]
    );

    const getCallNote = useCallback(
        async (ticketId: string): Promise<CallNote | null> => {
            if (!ready)
                throw new Error("Parâmetros ausentes (accountcode/profileId)");
            try {
                return await getCallNoteApi(accountcode!, profileId!, ticketId);
            } catch (e) {
                setError(e as Error);
                throw e;
            }
        },
        [ready, accountcode, profileId]
    );

    const removeCallNote = useCallback(
        async (ticketId: string) => {
            if (!ready)
                throw new Error("Parâmetros ausentes (accountcode/profileId)");
            setSaving(true);
            setError(null);
            try {
                await deleteCallNoteApi(accountcode!, profileId!, ticketId);
            } catch (e) {
                setError(e as Error);
                throw e;
            } finally {
                setSaving(false);
            }
        },
        [ready, accountcode, profileId]
    );

    // Função para verificar se um profile específico existe (útil para login)
    const checkProfileExists = useCallback(
        async (
            targetAccountcode: string,
            targetProfileId: string
        ): Promise<boolean> => {
            try {
                const profile = await getProfileByUserId(
                    targetAccountcode,
                    targetProfileId
                );
                if (profile) {
                    setUserFirebase(profile);
                    return true;
                } else {
                    return false;
                }
            } catch (e) {
                console.error("Erro ao verificar profile:", e);
                return false;
            }
        },
        []
    );

    // Função para criar um novo profile
    const createProfile = useCallback(
        async (
            profileId: string,
            targetAccountcode: string,
            profileData: Omit<
                Profile,
                "accountcode" | "createdAt" | "updatedAt"
            >
        ): Promise<string> => {
            try {
                let id = await createProfileApi(
                    profileId,
                    targetAccountcode,
                    profileData
                );
                const profile = await getProfile(targetAccountcode, id);
                setUserFirebase(profile);

                return profile.userId;
            } catch (e) {
                console.error("Erro ao criar profile:", e);
                throw e;
            }
        },
        []
    );

    // Função para verificar e atualizar profile com dados mais recentes
    const syncProfileWithUserData = useCallback(
        async (
            targetAccountcode: string,
            targetProfileId: string,
            userData: { name?: string; login?: string; extension?: string }
        ): Promise<boolean> => {
            try {
                const currentProfile = await getProfileApi(
                    targetAccountcode,
                    targetProfileId
                );
                if (!currentProfile) return false;

                const updates: Partial<Profile> = {};
                let hasChanges = false;

                // Verificar se o nome mudou
                if (userData.name && currentProfile.name !== userData.name) {
                    updates.name = userData.name;
                    hasChanges = true;
                }

                // Verificar se a descrição precisa ser atualizada com base no login/extension
                const expectedDescription = `Profile criado automaticamente para ${
                    userData.name || userData.login
                }`;
                if (currentProfile.description !== expectedDescription) {
                    updates.description = expectedDescription;
                    hasChanges = true;
                }

                if (hasChanges) {
                    await updateProfileApi(targetAccountcode, targetProfileId, {
                        ...updates,
                        updatedBy: targetProfileId,
                        updatedAt: serverTimestamp() as any,
                    });
                    return true;
                }

                return false;
            } catch (e) {
                console.error("Erro ao sincronizar profile:", e);
                return false;
            }
        },
        []
    );

    const refresh = useCallback(async () => {
        if (!ready) return;
        setLoading(true);
        setError(null);
        try {
            const p = await getProfileApi(accountcode!, profileId!);
            setProfile(p);

            const cfgs = await listProfileConfigurationsApi(
                accountcode!,
                profileId!
            );
            setConfigs(cfgs);
        } catch (e) {
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    }, [ready, accountcode, profileId]);

    const stop = useCallback(() => {
        unsubProfileRef.current?.();
        unsubProfileRef.current = undefined;
        unsubConfigsRef.current?.();
        unsubConfigsRef.current = undefined;
    }, []);

    // watchers
    useEffect(() => {
        stop();
        setProfile(null);
        setConfigs([]);
        setError(null);

        if (!ready) {
            setLoading(false);
            return;
        }

        let mounted = true;
        setLoading(true);
        (async () => {
            try {
                if (autoCreate) await ensure();

                // profile (doc)
                unsubProfileRef.current = onSnapshot(
                    getProfileDoc(accountcode!, profileId!),
                    (snap) => {
                        if (!mounted) return;
                        setProfile(
                            snap.exists() ? (snap.data() as Profile) : null
                        );
                        setLoading(false);
                    },
                    (err) => {
                        if (!mounted) return;
                        setError(err as Error);
                        setLoading(false);
                    }
                );

                // configurations (subcol)
                unsubConfigsRef.current = onSnapshot(
                    getProfileConfigurationsCollection(
                        accountcode!,
                        profileId!
                    ),
                    (snap) => {
                        if (!mounted) return;
                        setConfigs(
                            snap.docs.map(
                                (d) => d.data() as ProfileConfiguration
                            )
                        );
                    },
                    (err) => {
                        if (!mounted) return;
                        setError(err as Error);
                    }
                );
            } catch (e) {
                if (!mounted) return;
                setError(e as Error);
                setLoading(false);
            }
        })();

        return () => {
            mounted = false;
            stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, accountcode, profileId, autoCreate]); // dependências principais

    return {
        // estado
        ready,
        loading,
        saving,
        error,

        // chaves
        accountcode,
        profileId,

        // dados
        profile,
        configs,
        configMap, // Map<string, unknown>

        // ações
        ensure,
        updateProfile,
        setConfig,
        removeConfig,
        refresh,
        stop,
        checkProfileExists,
        createProfile,
        syncProfileWithUserData,
        setCallNote,
        getCallNote,
        removeCallNote,
    };
}
