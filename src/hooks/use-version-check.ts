import { useCallback, useState } from "react";
import { BUILD_META } from "@/build-meta";

type RemoteVersion = {
    buildId?: string;
    version?: string;
    commit?: string;
    builtAt?: string;
    buildTime?: string;
};

const LOCAL_ID = BUILD_META?.buildId ?? BUILD_META?.version;
const LOCAL_TIME = BUILD_META?.builtAt ?? BUILD_META?.buildTime;
const LOCAL_COMMIT = BUILD_META?.commit ?? "";

const getId = (m: Partial<RemoteVersion>) => m.buildId ?? m.version;
const getTime = (m: Partial<RemoteVersion>) => m.builtAt ?? m.buildTime;

function isSameVersion(remote: RemoteVersion): boolean {
    const remoteId = getId(remote);
    const remoteTime = getTime(remote);

    if (remoteId && LOCAL_ID && remoteId === LOCAL_ID) return true;
    if (remote.commit && LOCAL_COMMIT && remote.commit === LOCAL_COMMIT)
        return true;
    if (remoteTime && LOCAL_TIME && remoteTime === LOCAL_TIME) return true;

    return false;
}

async function fetchRemote(): Promise<RemoteVersion | null> {
    try {
        const res = await fetch(`/version.json?ts=${Date.now()}`, {
            cache: "no-store",
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export function useVersionCheck() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [hasUpdate, setHasUpdate] = useState(false);

    const checkVersion = useCallback(async () => {
        setLoading(true);
        setMessage(null);
        setHasUpdate(false);

        try {
            const remote = await fetchRemote();
            if (!remote) {
                setMessage("Não foi possível verificar a versão.");
                return;
            }

            if (isSameVersion(remote)) {
                setMessage("Você já está na versão mais recente.");
            } else {
                setMessage("Nova versão disponível! Clique para atualizar.");
                setHasUpdate(true);
            }
        } catch (err: any) {
            setMessage(`Erro ao verificar: ${err?.message ?? String(err)}`);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        message,
        hasUpdate,
        commit: LOCAL_COMMIT,
        checkVersion,
    };
}
