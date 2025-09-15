// src/hooks/use-app-update.tsx
import { useEffect, useRef } from "react"
import { BUILD_META } from "@/build-meta"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

type RemoteVersion = {
    buildId?: string
    version?: string
    commit?: string
    builtAt?: string
    buildTime?: string
}

const getId = (m: { buildId?: string; version?: string }) => m.buildId ?? m.version
const getTime = (m: { builtAt?: string; buildTime?: string }) => m.builtAt ?? m.buildTime

const LOCAL_ID = BUILD_META.buildId ?? BUILD_META.version
const LOCAL_TIME = BUILD_META.builtAt ?? BUILD_META.buildTime
const LOCAL_COMMIT = BUILD_META.commit ?? ""

async function fetchRemote(): Promise<RemoteVersion | null> {
    try {
        const res = await fetch(`/version.json?ts=${Date.now()}`, { cache: "no-store" })
        if (!res.ok) return null
        return res.json()
    } catch {
        return null
    }
}

function isSame(remote: RemoteVersion) {
    const rId = getId(remote)
    const rTime = getTime(remote)
    if (rId && LOCAL_ID && rId === LOCAL_ID) return true
    if (remote.commit && LOCAL_COMMIT && remote.commit === LOCAL_COMMIT) return true
    if (rTime && LOCAL_TIME && rTime === LOCAL_TIME) return true
    return false
}

/**
 * Hook para checar atualizações do app.
 * Use uma vez no topo da árvore (ex.: em App.tsx).
 */
export function useAppUpdate(opts?: { intervalMs?: number }) {
    const { toast, dismiss } = useToast()
    const shownRef = useRef(false)
    const interval = opts?.intervalMs ?? 60_000

    useEffect(() => {
        let timer: number | undefined

        const check = async () => {
            const remote = await fetchRemote()
            if (!remote) return
            if (!isSame(remote) && !shownRef.current) {
                shownRef.current = true
                const t = toast({
                    variant: "warning",
                    title: "Atualização disponível",
                    description: "Uma nova versão do painel foi publicada.",
                    action: (
                        <ToastAction altText="Atualizar" onClick={() => window.location.reload()}>
                            Atualizar
                        </ToastAction>
                    ),
                })
                // Se quiser auto-dismissar após X ms:
                // setTimeout(() => dismiss(t.id), 15000)
            }
        }

        // Checa ao montar
        check()

        // Checa quando a aba voltar ao foco
        const onVisible = () => { if (document.visibilityState === "visible") check() }
        document.addEventListener("visibilitychange", onVisible)

        // Loop
        // @ts-ignore
        timer = window.setInterval(check, interval)

        return () => {
            document.removeEventListener("visibilitychange", onVisible)
            if (timer) clearInterval(timer)
        }
    }, [interval, toast, dismiss])
}
