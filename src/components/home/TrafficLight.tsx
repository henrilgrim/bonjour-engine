import { useEffect, useRef, useState } from "react"
import { Activity, AlertTriangle, CheckCircle, Cog } from "lucide-react"
import TrafficLightDialogConfig from "./traffic-light/TrafficLightDialogConfig"
import { PxAlertConfig, WebhookMethod } from "@/lib/firebase/firestore/dashboard/types";
import { useAuthStore } from "@/store/authStore";
import { useMonitoringDashStore } from "@/store/monitoringDashStore";
import { getAlertConfig, subscribeAlertConfig, createAlertConfig, updateAlertConfig, listAlertConfigs } from "@/lib/firebase/firestore/dashboard";


type Estados = { alerta?: string; critico?: string }

interface TrafficLightProps {
	accountcode: string
	totalAgents: number
	busyAgents: number
	pausedAgents: number
	estados?: Estados
}

type Status = "red" | "yellow" | "green"

// ===== defaults de repetição
const DEFAULT_SOUND_REPEAT_MS = 60_000       // 60s
const DEFAULT_WEBHOOK_REPEAT_MS = 5 * 60_000 // 5min

// ===== extensão local da config salva
type LocalConfig = PxAlertConfig & {
	soundMode?: "siren" | "beep"
	webhookEnabled?: boolean
	repeatSoundMs?: number
	repeatWebhookMs?: number
	webhook?: PxAlertConfig["webhook"] & {
		headersText?: string
		contentType?: string
		body?: string
	}
}

function normalizeCfg(accountcode: string, userId: string, raw?: Partial<PxAlertConfig>): LocalConfig {
	const method: WebhookMethod = raw?.webhook?.method === "POST" ? "POST" : "GET"
	const soundMode: "siren" | "beep" = raw?.soundMode === "beep" ? "beep" : "siren"

	const toMs = (v: unknown, def: number) =>
		Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.round(Number(v)) : def

	return {
		id: raw?.id,
		accountcode,
		soundEnabled: !!raw?.soundEnabled,
		soundMode,
		repeatSoundMs: toMs(raw?.repeatSoundMs, 60_000),
		webhookEnabled: raw?.webhookEnabled !== false,
		repeatWebhookMs: toMs(raw?.repeatWebhookMs, 300_000),
		webhook: {
			method,
			url: raw?.webhook?.url ?? "",
			headersText: raw?.webhook?.headersText ?? "",
			contentType: raw?.webhook?.contentType ?? "application/json",
			body: raw?.webhook?.body ?? "",
		},
		createdAt: (raw as any)?.createdAt,
		updatedAt: (raw as any)?.updatedAt,
		createdBy: userId,
		visible: raw?.visible ?? true,
	}
}

const parseHeaders = (text?: string) => {
	const out: Record<string, string> = {}
	if (!text) return out
	text
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean)
		.forEach((line) => {
			const i = line.indexOf(":")
			if (i > 0) {
				const k = line.slice(0, i).trim()
				const v = line.slice(i + 1).trim()
				if (k) out[k] = v
			}
		})
	return out
}

const applyTemplate = (tpl: string, vars: Record<string, string | number>) => Object.entries(vars).reduce((acc, [k, v]) => acc.replace(new RegExp(`{{${k}}}`, "g"), String(v)), tpl)

function getLevelFromConfig(totalAgents: number, totalBusyAgents: number, totalPausedAgents: number, estados?: Estados): Status {
	const toNum = (v: unknown, def: number) => {
		const n = Number(v)
		return Number.isFinite(n) ? n : def
	}

	// ⬇️ Nova regra: só Alerta e Crítico (defaults alinhados ao formulário)
	let alerta = toNum(estados?.alerta, 70)
	let critico = toNum(estados?.critico, 100)

	// Clamps para manter 0 ≤ alerta < critico ≤ 100
	const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
	alerta = clamp(alerta, 0, 99)     // deixa espaço para o crítico
	critico = clamp(critico, 1, 100)
	if (critico <= alerta) critico = Math.min(100, alerta + 1)

	if (totalAgents <= 0) return "green"

	const pct = (totalBusyAgents + totalPausedAgents) / totalAgents * 100

	if (pct >= critico) return "red"
	if (pct >= alerta) return "yellow"
	return "green"
}

export default function TrafficLight({ accountcode, totalAgents, busyAgents, pausedAgents, estados }: TrafficLightProps) {
	const occupancyPercentage = totalAgents > 0 ? (busyAgents / totalAgents) * 100 : 0
	const status: Status = getLevelFromConfig(totalAgents, busyAgents, pausedAgents, estados)
	const user = useAuthStore(s => s.user)
	const dashId = useMonitoringDashStore(s => s.dashSelected).id


	const tokenMap: Record<Status, string> = {
		red: "var(--traffic-red, 0 84% 60%)",
		yellow: "var(--traffic-yellow, 47.9 95.8% 53.1%)",
		green: "var(--traffic-green, 142.1 70.6% 45.3%)",
	}

	const activeHsl = `hsl(${tokenMap[status]})`
	const activeHslTo = `hsl(${tokenMap[status]} / 0.9)`
	const inactiveHsl = `hsl(var(--muted-foreground))`

	// ===== Config persistida
	const [dialogOpen, setDialogOpen] = useState(false)
	const [cfg, setCfg] = useState<LocalConfig | null>(null)

	useEffect(() => {
		let unsub: undefined | (() => void)

			; (async () => {
				if (!dashId || !user?.id) return

				let alertCfg: PxAlertConfig | undefined = undefined

				// Tenta listar todos os alertas do painel
				let alerts = await listAlertConfigs(accountcode, dashId)

				// Se encontrar pelo menos um, pega o primeiro
				if (alerts.length > 0) {
					alertCfg = alerts[0]
				} else {
					// Se não existe nenhum, cria um
					const createdId = await createAlertConfig(accountcode, dashId, { createdBy: user.id })
					alertCfg = await getAlertConfig(accountcode, dashId, createdId)
				}

				// Aplica config normalizada
				setCfg(normalizeCfg(accountcode, user.id, alertCfg ?? {}))

				// Inscreve atualizações em tempo real
				if (alertCfg?.id) {
					unsub = subscribeAlertConfig(accountcode, dashId, alertCfg.id, (c) => {
						if (c) setCfg(normalizeCfg(accountcode, user.id, c))
					})
					// Nota: subscribeAlertConfig já registra automaticamente o listener
				}

			})()

		return () => unsub?.()
	}, [accountcode, dashId, user?.id])


	// ===== Áudio (siren + beep)
	const audioCtxRef = useRef<AudioContext | null>(null)
	const ensureAudioContext = async () => {
		// @ts-ignore Safari
		const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext
		if (!audioCtxRef.current) audioCtxRef.current = new AC()
		try { await audioCtxRef.current.resume() } catch { }
	}

	const playBeep = (ms = 600, freq = 880) => {
		if (!cfg?.soundEnabled) return
		const ctx = audioCtxRef.current
		if (!ctx) return
		const osc = ctx.createOscillator()
		const gain = ctx.createGain()
		osc.type = "sine"
		osc.frequency.value = freq
		osc.connect(gain); gain.connect(ctx.destination)
		const now = ctx.currentTime
		gain.gain.setValueAtTime(0.0001, now)
		gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05)
		gain.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000)
		osc.start(now)
		osc.stop(now + ms / 1000 + 0.05)
	}

	const playSiren = (durationMs = 3000) => {
		if (!cfg?.soundEnabled) return
		const ctx = audioCtxRef.current
		if (!ctx) return
		const osc = ctx.createOscillator()
		const gain = ctx.createGain()
		osc.type = "sine"
		osc.connect(gain); gain.connect(ctx.destination)
		const now = ctx.currentTime
		const dur = durationMs / 1000
		const half = dur / 2
		osc.frequency.setValueAtTime(700, now)
		osc.frequency.linearRampToValueAtTime(1200, now + half)
		osc.frequency.linearRampToValueAtTime(700, now + dur)
		gain.gain.setValueAtTime(0.0001, now)
		gain.gain.exponentialRampToValueAtTime(0.3, now + 0.08)
		gain.gain.setValueAtTime(0.3, now + dur - 0.2)
		gain.gain.exponentialRampToValueAtTime(0.0001, now + dur)
		osc.start(now)
		osc.stop(now + dur + 0.05)
	}

	const playAlertSound = async () => {
		if (!cfg?.soundEnabled) return
		await ensureAudioContext()
		if (cfg.soundMode === "siren") playSiren()
		else playBeep()
	}

	// ===== Webhook
	const callWebhook = async (reason: "enter" | "repeat" | "test") => {
		if (!cfg?.webhookEnabled) return
		if (!cfg?.webhook?.url) return
		try {
			const u = new URL(cfg.webhook.url)
			const vars = {
				reason,
				status: status === "red" ? "critical" : status === "yellow" ? "warning" : "normal",
				occupancy: Math.round(occupancyPercentage),
				busy: busyAgents,
				paused: pausedAgents,
				total: totalAgents,
				ts: new Date().toISOString(),
			}

			if (cfg.webhook.method === "GET") {
				const qs = new URLSearchParams({
					reason: vars.reason,
					status: String(vars.status),
					occupancy: String(vars.occupancy),
					busy: String(vars.busy),
					paused: String(vars.paused),
					total: String(vars.total),
					ts: vars.ts,
				})
				u.search = u.search ? `${u.search}&${qs.toString()}` : qs.toString()
				await fetch(u.toString(), { method: "GET", mode: "no-cors" })
			} else {
				const headers: Record<string, string> = parseHeaders(cfg.webhook.headersText)
				const ct = (cfg.webhook.contentType || "application/json").trim()
				if (ct && !headers["Content-Type"]) headers["Content-Type"] = ct
				let bodyStr = (cfg.webhook.body || "").trim()
				bodyStr = bodyStr ? applyTemplate(bodyStr, vars) : JSON.stringify(vars)
				await fetch(u.toString(), { method: "POST", mode: "no-cors", headers, body: bodyStr })
			}
		} catch {
			// ignora erros/CORS
		}
	}

	// ===== Transições/intervalos
	const prevStatusRef = useRef<Status>(status)

	// Entrou em crítico -> toca + envia 1x
	useEffect(() => {
		const prev = prevStatusRef.current
		if (status === "red" && prev !== "red") {
			void playAlertSound()
			void callWebhook("enter")
		}
		prevStatusRef.current = status
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [status, cfg?.soundEnabled, cfg?.soundMode, cfg?.webhookEnabled, cfg?.webhook?.url, cfg?.webhook?.method, cfg?.webhook?.headersText, cfg?.webhook?.body, cfg?.webhook?.contentType])

	// Enquanto crítico -> repetir com intervalos configuráveis
	useEffect(() => {
		if (status !== "red") return
		const soundMs = Math.max(0, Number(cfg?.repeatSoundMs ?? DEFAULT_SOUND_REPEAT_MS))
		const hookMs = Math.max(0, Number(cfg?.repeatWebhookMs ?? DEFAULT_WEBHOOK_REPEAT_MS))
		const soundInt = soundMs > 0 && cfg?.soundEnabled ? setInterval(() => { void playAlertSound() }, soundMs) : undefined
		const hookInt = hookMs > 0 && (cfg?.webhookEnabled ?? true) ? setInterval(() => { void callWebhook("repeat") }, hookMs) : undefined
		return () => { if (soundInt) clearInterval(soundInt); if (hookInt) clearInterval(hookInt) }
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [status, cfg?.soundEnabled, cfg?.soundMode, cfg?.repeatSoundMs, cfg?.webhookEnabled, cfg?.repeatWebhookMs, cfg?.webhook?.url, cfg?.webhook?.method, cfg?.webhook?.headersText, cfg?.webhook?.body, cfg?.webhook?.contentType])

	const handleSave = async () => {
		if (!cfg) return
		const payload: Partial<PxAlertConfig> = {
			accountcode,
			soundEnabled: cfg.soundEnabled,
			soundMode: cfg.soundMode,           // tipado
			repeatSoundMs: cfg.repeatSoundMs,
			webhookEnabled: cfg.webhookEnabled,
			repeatWebhookMs: cfg.repeatWebhookMs,
			webhook: {
				method: cfg.webhook?.method ?? "GET",
				url: cfg.webhook?.url ?? "",
				headersText: cfg.webhook?.headersText ?? "",
				contentType: cfg.webhook?.contentType ?? "application/json",
				body: cfg.webhook?.body ?? "",
			},
			visible: cfg.visible,
		}
		await updateAlertConfig(accountcode, dashId, cfg.id, payload)
		setDialogOpen(false)
	}

	// === UI ===
	const getStatusIcon = () =>
		status === "red" ? <AlertTriangle className="w-6 h-6 lg:w-8 lg:h-8" /> :
			status === "yellow" ? <Activity className="w-6 h-6 lg:w-8 lg:h-8" /> :
				<CheckCircle className="w-6 h-6 lg:w-8 lg:h-8" />

	return (
		<div className="lg:p-8 text-center transition-all duration-300" style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
			{/* Título + engrenagem */}
			<div className="mb-4 lg:mb-6 flex items-center justify-center gap-2">
				<h3 className="text-xl lg:text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
					Status Geral
				</h3>

				<TrafficLightDialogConfig
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					cfg={cfg}
					setCfg={setCfg}
					onSave={handleSave}
					onPlaySound={() => playAlertSound()}
					onTestWebhook={() => callWebhook("test")}
					onEnsureAudioContext={() => ensureAudioContext()}
					defaults={{ repeatSoundMs: DEFAULT_SOUND_REPEAT_MS, repeatWebhookMs: DEFAULT_WEBHOOK_REPEAT_MS }}
					trigger={
						<button className="ml-2 text-foreground hover:text-foreground">
							<Cog className="h-4 w-4" />
							<span className="sr-only">Abrir configurações</span>
						</button>
					}
				/>

			</div>

			{/* Semáforo */}
			<div className="relative mx-auto w-24 h-32 lg:w-32 lg:h-40 rounded-3xl p-2 lg:p-3 mb-5 lg:mb-6 shadow-2xl border" style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
				<div className="absolute inset-2 lg:inset-3 rounded-2xl flex flex-col justify-around items-center py-2 lg:py-3" style={{ backgroundColor: "hsl(var(--background))" }}>
					{/* Vermelho */}
					<div
						className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full transition-all duration-500 ${status === "red" ? "scale-110" : ""}`}
						style={{ backgroundColor: status === "red" ? `hsl(${tokenMap.red})` : inactiveHsl, boxShadow: status === "red" ? `0 0 24px hsl(${tokenMap.red})` : "none" }}
					/>
					{/* Amarelo */}
					<div
						className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full transition-all duration-500 ${status === "yellow" ? "scale-110" : ""}`}
						style={{ backgroundColor: status === "yellow" ? `hsl(${tokenMap.yellow})` : inactiveHsl, boxShadow: status === "yellow" ? `0 0 24px hsl(${tokenMap.yellow})` : "none" }}
					/>
					{/* Verde */}
					<div
						className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full transition-all duration-500 ${status === "green" ? "scale-110" : ""}`}
						style={{ backgroundColor: status === "green" ? `hsl(${tokenMap.green})` : inactiveHsl, boxShadow: status === "green" ? `0 0 24px hsl(${tokenMap.green})` : "none" }}
					/>
				</div>
			</div>

			{/* Status Info */}
			<div className="flex items-center justify-center gap-2 lg:gap-3 mb-4 lg:mb-6" style={{ color: activeHsl }}>
				{getStatusIcon()}
				<span className="text-xl lg:text-3xl font-bold">
					{status === "red" ? "Crítico" : status === "yellow" ? "Atenção" : "Normal"}
				</span>
			</div>

			{/* Stats */}
			<div className="space-y-2 lg:space-y-3">
				<div className="flex justify-between text-sm lg:text-base">
					<span className="font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Ocupação:</span>
					<span className="font-bold lg:text-lg" style={{ color: "hsl(var(--foreground))" }}>{Math.round(occupancyPercentage)}%</span>
				</div>
				<div className="flex justify-between text-sm lg:text-base">
					<span className="font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Ocupados:</span>
					<span className="font-bold lg:text-lg" style={{ color: "hsl(var(--foreground))" }}>{busyAgents} /{totalAgents}</span>
				</div>
			</div>

			{/* Barra de ocupação */}
			<div className="mt-4 lg:mt-6">
				<div className="w-full rounded-full h-3 lg:h-4 shadow-inner" style={{ backgroundColor: "hsl(var(--input))" }}>
					<div
						className="h-full rounded-full transition-all duration-700 shadow-lg bg-gradient-to-r"
						style={{
							width: `${occupancyPercentage}%`,
							backgroundImage: `linear-gradient(90deg, ${activeHsl}, ${activeHslTo})`,
							boxShadow: `0 4px 12px ${activeHsl}55`,
						}}
					/>
				</div>
			</div>
		</div>
	)
}
