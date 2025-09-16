import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Cog, Volume2 } from "lucide-react"
import * as React from "react"
import { PxAlertConfig, WebhookMethod } from "@/lib/firebase/firestore/dashboard/types"

/** A extensão local que você já usa no TrafficLight */
export type LocalConfig = PxAlertConfig & {
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

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    cfg: LocalConfig | null
    setCfg: React.Dispatch<React.SetStateAction<LocalConfig | null>>

    /** ações externas (TrafficLight decide o que fazer) */
    onSave: () => Promise<void> | void
    onPlaySound: () => Promise<void> | void
    onTestWebhook: () => Promise<void> | void
    onEnsureAudioContext?: () => Promise<void> | void

    /** valores padrão (para exibir no formulário) */
    defaults?: {
        repeatSoundMs?: number
        repeatWebhookMs?: number
    }

    /** gatilho do diálogo (opcional) — se omitido, você controla o open externamente */
    trigger?: React.ReactNode
}

export default function TrafficLightDialogConfig({
    open,
    onOpenChange,
    cfg,
    setCfg,
    onSave,
    onPlaySound,
    onTestWebhook,
    onEnsureAudioContext,
    defaults = { repeatSoundMs: 60_000, repeatWebhookMs: 5 * 60_000 },
    trigger,
}: Props) {
    const DEFAULT_SOUND_REPEAT_MS = defaults.repeatSoundMs ?? 60_000
    const DEFAULT_WEBHOOK_REPEAT_MS = defaults.repeatWebhookMs ?? 300_000

    // preset opcional (mantive do seu código)
    const applyGoogleChatPreset = React.useCallback(() => {
        setCfg((c) => {
            if (!c) return c
            return {
                ...c,
                webhookEnabled: true,
                webhook: {
                    ...(c.webhook ?? { method: "POST", url: "" }),
                    method: "POST",
                    contentType: "application/json",
                    headersText: "",
                    body: `{
  "text": "*[{{status}}]* Ocupação {{occupancy}}% ({{busy}}/{{total}}) — {{ts}}"
}`,
                },
            }
        })
    }, [setCfg])

    const isProd =
        (typeof import.meta !== "undefined" && (import.meta as any)?.env?.PROD === true) ||
        (typeof process !== "undefined" && process.env?.NODE_ENV === "production");


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Configurações de alerta</DialogTitle>
                    <DialogDescription>
                        Configure os alertas de ocupação e webhook para o Semáforo.
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto overscroll-contain nice-scroll" style={{ scrollbarGutter: "stable" }}>
                    {cfg && (
                        <div className="space-y-6">
                            {/* Som */}
                            <div className="space-y-3 rounded-md border p-3">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <Label htmlFor="soundToggle">Som de alerta</Label>
                                        <p className="text-xs text-muted-foreground">Navegadores exigem uma interação antes de tocar áudio.</p>
                                    </div>
                                    <Switch
                                        id="soundToggle"
                                        checked={!!cfg.soundEnabled}
                                        onCheckedChange={async (v) => {
                                            const next = { ...cfg, soundEnabled: v }
                                            setCfg(next)
                                            if (v && onEnsureAudioContext) await onEnsureAudioContext()
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr_auto] gap-3 items-center">
                                    <Label>Tipo de som</Label>
                                    <Select
                                        value={cfg.soundMode ?? "siren"}
                                        onValueChange={(v: "siren" | "beep") => setCfg({ ...cfg, soundMode: v })}
                                    >
                                        <SelectTrigger disabled={!cfg.soundEnabled}><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="siren">Sirene</SelectItem>
                                            <SelectItem value="beep">Beep</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" variant="outline" size="sm" onClick={() => void onPlaySound()} disabled={!cfg.soundEnabled}>
                                        <Volume2 className="h-4 w-4 mr-1" /> Tocar teste
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center">
                                    <Label htmlFor="repeatSound">Repetir som a cada (seg)</Label>
                                    <Input
                                        id="repeatSound"
                                        type="number"
                                        min={0}
                                        step={5}
                                        value={Math.round((cfg.repeatSoundMs ?? DEFAULT_SOUND_REPEAT_MS) / 1000)}
                                        onChange={(e) => {
                                            const s = Math.max(0, Number(e.currentTarget.value || 0))
                                            setCfg({ ...cfg, repeatSoundMs: Math.round(s * 1000) })
                                        }}
                                        disabled={!cfg.soundEnabled}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Use 0 para desativar a repetição (tocará só ao entrar em crítico).</p>
                            </div>

                            {/* Webhook */}
                            <div className="space-y-3 rounded-md border p-3">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <Label htmlFor="webhookToggle">Enviar webhook</Label>
                                        <p className="text-xs text-muted-foreground">Desative para “som apenas” sem enviar alertas.</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Switch id="webhookToggle" checked={cfg.webhookEnabled !== false} onCheckedChange={(v) => setCfg({ ...cfg, webhookEnabled: v })} />
                                        {!isProd && (<Button type="button" variant="ghost" size="sm" onClick={applyGoogleChatPreset} disabled={cfg.webhookEnabled === false}>
                                            <Cog className="h-4 w-4 mr-1" /> Configurar Google Chat
                                        </Button>)}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 items-center">
                                    <Label>Método</Label>
                                    <Select
                                        value={cfg.webhook?.method ?? "GET"}
                                        onValueChange={(v: WebhookMethod) =>
                                            setCfg({ ...cfg, webhook: { ...(cfg.webhook ?? {}), method: v, url: cfg.webhook?.url ?? "" } })
                                        }
                                        disabled={cfg.webhookEnabled === false}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GET">GET</SelectItem>
                                            <SelectItem value="POST">POST</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 items-center">
                                    <Label htmlFor="url">URL</Label>
                                    <Input
                                        id="url"
                                        placeholder="https://chat.googleapis.com/v1/spaces/xxx/messages?key=..."
                                        value={cfg.webhook?.url ?? ""}
                                        onChange={(e) => setCfg({ ...cfg, webhook: { ...(cfg.webhook ?? {}), url: e.target.value, method: cfg.webhook?.method ?? "GET" } })}
                                        disabled={cfg.webhookEnabled === false}
                                    />
                                </div>

                                {cfg.webhook?.method === "POST" && (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 items-center">
                                            <Label htmlFor="ct">Content-Type</Label>
                                            <Input
                                                id="ct"
                                                placeholder="application/json"
                                                value={cfg.webhook?.contentType ?? "application/json"}
                                                onChange={(e) =>
                                                    setCfg({
                                                        ...cfg,
                                                        webhook: {
                                                            ...(cfg.webhook ?? {}),
                                                            contentType: e.target.value,
                                                            method: cfg.webhook?.method ?? "GET",
                                                            url: cfg.webhook?.url ?? "",
                                                        }
                                                    })
                                                }
                                                disabled={cfg.webhookEnabled === false}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="headers">Headers (um por linha)</Label>
                                                <Button type="button" variant="ghost" size="sm" onClick={applyGoogleChatPreset} disabled={cfg.webhookEnabled === false}>Google Chat</Button>
                                            </div>
                                            <Textarea
                                                id="headers"
                                                placeholder={`Authorization: Bearer xxxxxx\nX-Env: prod`}
                                                value={cfg.webhook?.headersText ?? ""}
                                                onChange={(e) =>
                                                    setCfg({
                                                        ...cfg,
                                                        webhook: {
                                                            ...(cfg.webhook ?? {}),
                                                            method: cfg.webhook?.method ?? "GET",
                                                            url: cfg.webhook?.url ?? "",
                                                            headersText: e.target.value
                                                        }
                                                    })
                                                }
                                                rows={3}
                                                disabled={cfg.webhookEnabled === false}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-2">
                                            <Label htmlFor="body">Body (template)</Label>
                                            <Textarea
                                                id="body"
                                                placeholder={`{ "text": "*[{{status}}]* Ocupação {{occupancy}}% ({{busy}}/{{total}}) — {{ts}}" }`}
                                                value={cfg.webhook?.body ?? ""}
                                                onChange={(e) =>
                                                    setCfg({
                                                        ...cfg,
                                                        webhook: {
                                                            ...(cfg.webhook ?? {}),
                                                            method: cfg.webhook?.method ?? "GET",
                                                            url: cfg.webhook?.url ?? "",
                                                            headersText: cfg.webhook?.headersText,
                                                            contentType: cfg.webhook?.contentType,
                                                            body: e.target.value
                                                        }
                                                    })
                                                }
                                                rows={6}
                                                disabled={cfg.webhookEnabled === false}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Placeholders:{" "}
                                                <code className="bg-muted px-1 rounded">{`{{status}}`}</code>,{" "}
                                                <code className="bg-muted px-1 rounded">{`{{reason}}`}</code>,{" "}
                                                <code className="bg-muted px-1 rounded">{`{{occupancy}}`}</code>,{" "}
                                                <code className="bg-muted px-1 rounded">{`{{busy}}`}</code>,{" "}
                                                <code className="bg-muted px-1 rounded">{`{{total}}`}</code>,{" "}
                                                <code className="bg-muted px-1 rounded">{`{{ts}}`}</code>.
                                            </p>
                                        </div>
                                    </>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center">
                                    <Label htmlFor="repeatHook">Repetir webhook a cada (seg)</Label>
                                    <Input
                                        id="repeatHook"
                                        type="number"
                                        min={0}
                                        step={10}
                                        value={Math.round((cfg.repeatWebhookMs ?? DEFAULT_WEBHOOK_REPEAT_MS) / 1000)}
                                        onChange={(e) => {
                                            const s = Math.max(0, Number(e.currentTarget.value || 0))
                                            setCfg({ ...cfg, repeatWebhookMs: Math.round(s * 1000) })
                                        }}
                                        disabled={cfg.webhookEnabled === false}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Use 0 para desativar a repetição (envia só ao entrar em crítico).</p>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => void onTestWebhook()}
                                        disabled={!cfg.webhook?.url || cfg.webhookEnabled === false}
                                    >
                                        Testar envio
                                    </Button>
                                    {/* Exemplo de preset, se quiser habilitar:
                    <Button type="button" variant="ghost" onClick={applyGoogleChatPreset} disabled={cfg.webhookEnabled === false}>
                      <Wand2 className="h-4 w-4 mr-1" /> Google Chat
                    </Button> */}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={() => void onSave()} disabled={!cfg}>
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
