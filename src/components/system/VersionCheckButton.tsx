import { useState } from "react";
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

function isSameVersion(remote: RemoteVersion): boolean {
    const remoteId = getId(remote);
    const remoteTime = getTime(remote);

    if (remoteId && LOCAL_ID && remoteId === LOCAL_ID) return true;
    if (remote.commit && LOCAL_COMMIT && remote.commit === LOCAL_COMMIT)
        return true;
    if (remoteTime && LOCAL_TIME && remoteTime === LOCAL_TIME) return true;

    return false;
}

export default function VersionCheckButton() {
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const checkVersion = async () => {
        setBusy(true);
        setMessage(null);

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
                if (
                    confirm(
                        "Nova versão detectada. Deseja recarregar a página agora?"
                    )
                ) {
                    window.location.reload();
                }
            }
        } catch (e: any) {
            setMessage(`Erro ao verificar: ${e?.message ?? String(e)}`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className="text-xs text-muted-foreground"
            title={LOCAL_COMMIT ? `Commit: ${LOCAL_COMMIT}` : "Sem commit"}
        >
            {message ? (
                <span className="block px-2 py-1 rounded bg-muted text-foreground/80">
                    {message}
                </span>
            ) : (
                <button
                    onClick={checkVersion}
                    disabled={busy}
                    className="w-full text-left text-xs px-3 py-1.5 rounded border border-border hover:bg-muted transition disabled:opacity-50"
                    aria-busy={busy}
                >
                    {busy ? "Checando versão…" : "Checar atualização"}
                </button>
            )}
        </div>
    );
}
