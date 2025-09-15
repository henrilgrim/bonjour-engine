import { useState } from "react"
import { BUILD_META } from "@/build-meta"

type RemoteVersion = {
	buildId?: string
	version?: string
	commit?: string
	builtAt?: string
	buildTime?: string
}

async function fetchRemote(): Promise<RemoteVersion | null> {
	try {
		const res = await fetch(`/version.json?ts=${Date.now()}`, { cache: "no-store" })
		if (!res.ok) return null
		return res.json()
	} catch {
		return null
	}
}

const getId = (m: { buildId?: string; version?: string }) => m.buildId ?? m.version
const getTime = (m: { builtAt?: string; buildTime?: string }) => m.builtAt ?? m.buildTime

const LOCAL_ID = (BUILD_META as any).buildId ?? (BUILD_META as any).version
const LOCAL_TIME = (BUILD_META as any).builtAt ?? (BUILD_META as any).buildTime
const LOCAL_COMMIT = (BUILD_META as any).commit ?? ""

function isSame(remote: RemoteVersion) {
	const rId = getId(remote)
	const rTime = getTime(remote)
	if (rId && LOCAL_ID && rId === LOCAL_ID) return true
	if (remote.commit && LOCAL_COMMIT && remote.commit === LOCAL_COMMIT) return true
	if (rTime && LOCAL_TIME && rTime === LOCAL_TIME) return true
	return false
}

export default function VersionCheckButton() {
	const [busy, setBusy] = useState(false)
	const [msg, setMsg] = useState<string | null>(null)

	const check = async () => {
		setBusy(true); setMsg(null)
		try {
			const remote = await fetchRemote()
			if (!remote) {
				setMsg("Não foi possível verificar a versão.")
				return
			}
			const same = isSame(remote)
			setMsg(same ? "Você já está na versão mais recente." : "Nova versão disponível! Clique para atualizar.")
			if (!same) {
				if (confirm("Nova versão disponível. Atualizar agora?")) {
					window.location.reload()
				}
			}
		} catch (e: any) {
			setMsg(`Falha ao checar: ${e?.message ?? String(e)}`)
		} finally {
			setBusy(false)
		}
	}

	// 👉 se houver msg, NÃO mostra o botão — só o texto
	if (msg) {
		return (
			<span className="text-xs px-2 py-1 rounded bg-muted text-foreground/80" title={LOCAL_COMMIT ? `commit: ${LOCAL_COMMIT}` : undefined}>
				{msg}
			</span>
		)
	}

	return (
		<button onClick={check} disabled={busy} className="text-xs px-2 py-1 rounded border hover:bg-muted transition" title={LOCAL_COMMIT ? `commit: ${LOCAL_COMMIT}` : "sem commit"}>
			{busy ? "Checando…" : "Checar atualização"}
		</button>
	)
}
