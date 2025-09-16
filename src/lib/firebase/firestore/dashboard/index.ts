import { collection, addDoc, setDoc, getDocs, onSnapshot, updateDoc, query, orderBy, serverTimestamp, doc, getDoc, Unsubscribe, where } from "firebase/firestore"
import { alertsConverter, dashboardConverter } from "./converter"
import { getMonitorPanelDoc } from ".."
import { FilaConfig, PxAlertConfig, PxDash, WebhookMethod } from "./types"
import { DEFAULT_SOUND_REPEAT_MS, DEFAULT_WEBHOOK_REPEAT_MS } from "@/constants"

export function getDashboardsCollection(accountcode: string) {
    return collection(getMonitorPanelDoc(accountcode), "dashboards").withConverter(dashboardConverter)
}

export function getDashboardDoc(accountcode: string, dashboardId: string) {
    return doc(getDashboardsCollection(accountcode), dashboardId)
}

export function getAlertsCollection(accountcode: string, dashboardId: string) {
    return collection(getDashboardDoc(accountcode, dashboardId), "alerts").withConverter(alertsConverter)
}

export function getAlertDoc(accountcode: string, dashboardId: string, alertId: string) {
    return doc(getAlertsCollection(accountcode, dashboardId), alertId)
}

export async function getDashboardById(accountcode: string, id: string): Promise<PxDash | null> {
    const ref = getDashboardDoc(accountcode, id)
    const snap = await getDoc(ref)
    return snap.exists() ? (snap.data() as PxDash) : null
}

export function subscribeDashboards(accountcode: string, opts: { accountcode?: string; userId?: string } | undefined, onNext: (items: PxDash[]) => void, onError?: (e: unknown) => void): () => void {
    let ref = getDashboardsCollection(accountcode)
    let base = query(ref, where("visible", "==", true))

    if (opts?.accountcode) base = query(base, where("accountcode", "==", opts.accountcode))
    if (opts?.userId) base = query(base, where("createdBy", "==", opts.userId))
    base = query(base, orderBy("nome"))

    return onSnapshot(base, (snap) => {
        const allDashes = snap.docs.map((d) => d.data() as PxDash)

        const filtered = opts?.userId
            ? allDashes.filter(dash => dash.createdBy === opts.userId || !dash.private)
            : allDashes.filter(dash => !dash.private)

        onNext(filtered)
    }, (err) => onError?.(err))
}

export function subscribePublicDashboards(accountcode: string, onNext: (items: PxDash[]) => void, onError?: (e: unknown) => void): () => void {
    let ref = getDashboardsCollection(accountcode)

    const base = query(
        ref,
        where("visible", "==", true),
        where("accountcode", "==", accountcode),
        where("private", "!=", true),
        orderBy("private"),
        orderBy("nome")
    )

    return onSnapshot(base, (snap) => onNext(snap.docs.map((d) => d.data() as PxDash)), (err) => onError?.(err))
}

export async function createDashboard(payload: PxDash): Promise<string> {
    let ref = getDashboardsCollection(payload.accountcode)
    const res = await addDoc(ref, payload)
    return res.id
}

export async function updateDashboard(accountcode: string, id: string, patch: Partial<PxDash>): Promise<void> {
    let ref = getDashboardDoc(accountcode, id)
    await updateDoc(ref, patch as any)
}

export async function updateFilaConfig(accountcode: string, id: string, filaId: string, config: FilaConfig): Promise<void> {
    let ref = getDashboardDoc(accountcode, id)
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new Error("Dashboard not found")

    const dashData = snap.data() as PxDash
    const filas = dashData.filas || []

    const updatedFilas = filas.map((fila) => {
        if (fila.id === filaId) {
            return { ...fila, configuracao: { ...fila.configuracao, ...config } }
        }
        return fila
    })

    await updateDoc(ref, { filas: updatedFilas })
}

export async function deleteDashboard(accountcode: string, id: string): Promise<void> {
    let ref = getDashboardDoc(accountcode, id)
    await updateDoc(ref, { visible: false })
}

// ALERTS
export async function getAlertConfig(accountcode: string, dashboardId: string, alertId: string): Promise<PxAlertConfig | null> {
    const snap = await getDoc(getAlertDoc(accountcode, dashboardId, alertId))
    return snap.exists() ? (snap.data() as PxAlertConfig) : null
}

export async function listAlertConfigs(accountcode: string, dashboardId: string): Promise<PxAlertConfig[]> {
    const ref = getAlertsCollection(accountcode, dashboardId)
    const snap = await getDocs(query(ref, orderBy("createdAt", "desc")))
    return snap.docs.map((d) => d.data() as PxAlertConfig)
}

const isPositiveInt = (v: unknown) => Number.isFinite(Number(v)) && Number(v) >= 0
const coerceRepeat = (v: unknown, def: number) => isPositiveInt(v) ? Math.round(Number(v)) : def

export async function createAlertConfig(accountcode: string, dashboardId: string, data: Partial<PxAlertConfig>): Promise<string> {
    const alertsRef = getAlertsCollection(accountcode, dashboardId)

    const base: PxAlertConfig = {
        accountcode,
        soundEnabled: false,
        soundMode: "siren",
        repeatSoundMs: DEFAULT_SOUND_REPEAT_MS,
        webhookEnabled: true,
        repeatWebhookMs: DEFAULT_WEBHOOK_REPEAT_MS,
        webhook: {
            method: "GET",
            url: "",
            headersText: "",
            contentType: "application/json",
            body: "",
        },
        createdBy: data.createdBy || null,
        createdAt: serverTimestamp(),
        visible: true,
    }

    const merged: PxAlertConfig = {
        ...base,
        ...data,
        soundMode: (data.soundMode ?? base.soundMode) as "siren" | "beep",
        repeatSoundMs: coerceRepeat(data.repeatSoundMs, DEFAULT_SOUND_REPEAT_MS),
        webhookEnabled: data.webhookEnabled ?? base.webhookEnabled,
        repeatWebhookMs: coerceRepeat(data.repeatWebhookMs, DEFAULT_WEBHOOK_REPEAT_MS),
        webhook: {
            ...base.webhook,
            ...(data.webhook ?? {}),
            method: (data.webhook?.method ?? base.webhook.method) as WebhookMethod,
            url: String(data.webhook?.url ?? base.webhook.url),
        },
    }

    const res = await addDoc(alertsRef, merged)
    return res.id
}

export async function updateAlertConfig(accountcode: string, dashboardId: string, alertId: string, data: Partial<PxAlertConfig>): Promise<void> {
    const docRef = getAlertDoc(accountcode, dashboardId, alertId)
    const current = await getAlertConfig(accountcode, dashboardId, alertId)

    if (!current) throw new Error(`Alerta ${alertId} não encontrado.`)

    const base: PxAlertConfig = {
        accountcode,
        soundEnabled: false,
        soundMode: "siren",
        repeatSoundMs: DEFAULT_SOUND_REPEAT_MS,
        webhookEnabled: true,
        repeatWebhookMs: DEFAULT_WEBHOOK_REPEAT_MS,
        webhook: {
            method: "GET",
            url: "",
            headersText: "",
            contentType: "application/json",
            body: "",
        },
        createdBy: current.createdBy || data.createdBy || null,
        visible: true,
        createdAt: current.createdAt,
    }

    const nextRepeatSoundMs = data.repeatSoundMs ?? current.repeatSoundMs ?? base.repeatSoundMs!
    const nextRepeatWebhookMs = data.repeatWebhookMs ?? current.repeatWebhookMs ?? base.repeatWebhookMs!

    const merged: PxAlertConfig = {
        ...base,
        ...current,
        ...data,
        soundMode: (data.soundMode ?? current.soundMode ?? base.soundMode) as "siren" | "beep",
        repeatSoundMs: coerceRepeat(nextRepeatSoundMs, DEFAULT_SOUND_REPEAT_MS),
        webhookEnabled: data.webhookEnabled ?? current.webhookEnabled ?? base.webhookEnabled,
        repeatWebhookMs: coerceRepeat(nextRepeatWebhookMs, DEFAULT_WEBHOOK_REPEAT_MS),
        webhook: {
            ...base.webhook,
            ...(current.webhook ?? {}),
            ...(data.webhook ?? {}),
            method: (data.webhook?.method ?? current.webhook?.method ?? base.webhook.method) as WebhookMethod,
            url: String(data.webhook?.url ?? current.webhook?.url ?? base.webhook.url),
        },
    }

    await setDoc(docRef, merged, { merge: true })
}

export function subscribeAlertConfig(accountcode: string, dashboardId: string, alertId: string, onNext: (cfg: PxAlertConfig | null) => void, onError?: (e: unknown) => void) {
    const ref = getAlertDoc(accountcode, dashboardId, alertId)

    return onSnapshot(ref, (snap) => onNext(snap.exists() ? (snap.data() as PxAlertConfig) : null),
        (err) => onError?.(err)
    )
}
