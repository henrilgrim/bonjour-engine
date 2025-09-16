import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Search, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuthStore } from "@/store/authStore"
import { PxDash } from "@/lib/firebase/firestore/dashboard/types"
import { createDashboard, subscribePublicDashboards, updateDashboard } from "@/lib/firebase/firestore/dashboard"

type QueueOption = { id: string; name: string; department?: string; strategy?: string }

type Props = {
    mode: "create" | "edit"
    initialDash?: PxDash
    accountcode?: string
    queues?: QueueOption[]
    queuesLoading?: boolean
    queuesError?: string
    onCreated?: (created: PxDash) => void
    onUpdated?: (updated: PxDash) => void

    // novo: controle externo do open
    open?: boolean
    onOpenChange?: (v: boolean) => void
}

export default function SelectDashDialog({ mode, initialDash, accountcode, queues = [], queuesLoading, queuesError, onCreated, onUpdated, open: openProp, onOpenChange }: Props) {
    const userId = useAuthStore((s) => s.user?.id)
    const { toast } = useToast()

    // controlado vs não-controlado
    const [openInternal, setOpenInternal] = useState(false)
    const open = openProp ?? openInternal
    const setOpen = (v: boolean) => {
        if (openProp === undefined) setOpenInternal(v)
        onOpenChange?.(v)
    }

    const [saving, setSaving] = useState(false)

    // Form state
    const [nome, setNome] = useState("")
    const [descricao, setDescricao] = useState("")
    const [thema, setThema] = useState<"dark" | "light" | "dark-high-contrast" | "light-high-contrast" | undefined>("light")
    const [alerta, setAlerta] = useState("65")
    const [critico, setCritico] = useState("80")
    const [isPrivate, setIsPrivate] = useState(false)

    // Copy dashboard functionality
    const [copyFromDashId, setCopyFromDashId] = useState<string | undefined>(undefined)
    const [publicDashboards, setPublicDashboards] = useState<PxDash[]>([])
    const [dashboardsLoading, setDashboardsLoading] = useState(false)

    type SelectedFila = { id: string; fila_importante: boolean }
    const [selectedFilas, setSelectedFilas] = useState<SelectedFila[]>([])
    const [qSearch, setQSearch] = useState("")

    useEffect(() => {
        if (mode === "edit" && initialDash) {
            setNome(initialDash.nome || "")
            setDescricao(initialDash.descricao || "")
            setThema(initialDash.thema || "light")
            setAlerta(initialDash.configuracao?.estados?.alerta || "70")
            setCritico(initialDash.configuracao?.estados?.critico || "100")
            setIsPrivate(initialDash.private || false)
            setSelectedFilas(
                initialDash.filas?.map(f => ({
                    id: f.id,
                    fila_importante: f.configuracao?.fila_importante || false
                })) || []
            )
        }
    }, [mode, initialDash])

    // Carregar dashboards públicos para copiar (apenas no modo create) — só quando open = true
    useEffect(() => {
        if (mode === "create" && accountcode && open) {
            setDashboardsLoading(true)
            const unsubscribe = subscribePublicDashboards(accountcode,
                (dashboards) => { setPublicDashboards(dashboards); setDashboardsLoading(false) },
                (error) => { console.error("Erro ao carregar dashboards:", error); setDashboardsLoading(false) }
            )
            // Nota: subscribePublicDashboards já registra automaticamente o listener
            return () => unsubscribe()
        }
    }, [mode, accountcode, open])

    const handleCopyFromDashboard = (dashId?: string) => {
        setCopyFromDashId(dashId)
        if (!dashId) return
        const selectedDash = publicDashboards.find(d => d.id === dashId)
        if (selectedDash) {
            setNome(selectedDash.nome + " (Cópia)")
            setDescricao(selectedDash.descricao || "")
            setThema(selectedDash.thema || "light")
            setAlerta(selectedDash.configuracao?.estados?.alerta || "70")
            setCritico(selectedDash.configuracao?.estados?.critico || "100")
            setSelectedFilas(
                selectedDash.filas?.map(f => ({
                    id: f.id,
                    fila_importante: f.configuracao?.fila_importante || false
                })) || []
            )
        }
    }

    const filteredQueues = useMemo(() => {
        const q = qSearch.trim().toLowerCase()
        if (!q) return queues
        return queues.filter(f => [f.name, f.department, f.strategy].some(v => v?.toLowerCase().includes(q)))
    }, [qSearch, queues])

    const toggleFilaSelecionada = (id: string, checked: boolean | string) => {
        setSelectedFilas(prev => (checked ? [...prev, { id, fila_importante: false }] : prev.filter(f => f.id !== id)))
    }

    const toggleFilaImportante = (id: string) => {
        setSelectedFilas(prev => prev.map(f => f.id === id ? { ...f, fila_importante: !f.fila_importante } : f))
    }

    const resetForm = () => {
        setNome(""); setDescricao(""); setThema("light")
        setAlerta("70"); setCritico("100"); setIsPrivate(false)
        setCopyFromDashId(undefined); setSelectedFilas([]); setQSearch("")
    }

    const toNum = (v: string) => Number.isFinite(Number(v)) ? Number(v) : NaN
    const clamp01 = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

    const handleSubmit = async () => {
        if (!accountcode) return toast({ variant: "destructive", title: "Erro", description: "Accountcode não disponível." })
        if (nome.trim().length < 3) return toast({ variant: "destructive", title: "Erro", description: "Digite um nome com pelo menos 3 caracteres." })

        let a = clamp01(toNum(alerta))
        let c = clamp01(toNum(critico))
        if (Number.isNaN(a) || Number.isNaN(c)) {
            return toast({ variant: "destructive", title: "Erro", description: "Preencha números válidos para Alerta e Crítico." })
        }
        if (!(a >= 0 && a < c && c <= 100)) {
            return toast({ variant: "destructive", title: "Erro", description: "Regra: 0 ≤ Alerta < Crítico ≤ 100." })
        }
        if (selectedFilas.length === 0) return toast({ variant: "destructive", title: "Erro", description: "Selecione ao menos uma fila." })

        setSaving(true)
        try {
            const filas = selectedFilas.map(f => ({
                id: f.id,
                configuracao: {
                    fila_importante: f.fila_importante,
                    estados: { alerta: String(a), critico: String(c) }
                }
            }))

            const payload: PxDash = {
                accountcode,
                nome: nome.trim(),
                descricao: descricao.trim() || undefined,
                thema,
                configuracao: { estados: { alerta: String(a), critico: String(c) } },
                filas,
                visible: true,
                createdBy: userId,
                private: isPrivate,
            }

            if (mode === "edit" && initialDash?.id) {
                await updateDashboard(accountcode, initialDash.id, payload)
                toast({ variant: "success", title: "Sucesso", description: "Dashboard atualizado!" })
                onUpdated?.({ ...payload, id: initialDash.id })
            } else {
                const id = await createDashboard(payload)
                toast({ variant: "success", title: "Sucesso", description: "Dashboard criado!" })
                onCreated?.({ ...payload, id })
            }

            setOpen(false)
            resetForm()
        } catch (e) {
            console.error(e)
            toast({ variant: "destructive", title: "Erro", description: "Erro ao salvar dashboard." })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{mode === "edit" ? "Editar dashboard" : "Novo dashboard"}</DialogTitle>
                    <DialogDescription>
                        {mode === "edit" ? "Atualize as informações do dashboard selecionado."
                            : "Defina as informações e selecione as filas que farão parte do dashboard."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Esquerda */}
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nome">Nome</Label>
                            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="descricao">Descrição</Label>
                            <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Tema</Label>
                            <Select value={thema} onValueChange={(v) => setThema(v as "dark" | "light")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dark">Escuro</SelectItem>
                                    <SelectItem value="light">Claro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Thresholds simplificados */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Alerta (%)</Label>
                                <Input
                                    inputMode="numeric"
                                    type="number"
                                    min={0}
                                    max={99}
                                    value={alerta}
                                    onChange={(e) => setAlerta(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Crítico (%)</Label>
                                <Input
                                    inputMode="numeric"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={critico}
                                    onChange={(e) => setCritico(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="rounded-md border bg-muted/30 p-3">
                            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                <Info className="h-4 w-4" />
                                <span className="text-sm font-medium">Como funciona</span>
                            </div>

                            <div className="grid gap-1.5 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    <span><b>Verde</b>: abaixo de <b>Alerta</b></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                                    <span><b>Amarelo</b>: a partir de <b>Alerta</b></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                                    <span><b>Vermelho</b>: a partir de <b>Crítico</b></span>
                                </div>
                            </div>

                            <div className="mt-3 text-xs text-muted-foreground">
                                Regra: <code className="rounded bg-muted px-1">0 ≤ Alerta &lt; Crítico ≤ 100</code>
                            </div>
                        </div>

                        {/* Opções adicionais */}
                        {mode === "create" && (
                            <div className="grid gap-2">
                                <Label>Copiar de dashboard existente</Label>
                                <Select
                                    value={copyFromDashId}
                                    onValueChange={(v) => handleCopyFromDashboard(v === "__none__" ? undefined : v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecionar dashboard para copiar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Criar do zero</SelectItem>

                                        {dashboardsLoading ? (
                                            <SelectItem value="__loading__" disabled>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Carregando...
                                            </SelectItem>
                                        ) : (
                                            publicDashboards.map((dash) => (
                                                <SelectItem key={dash.id} value={dash.id!}>
                                                    {dash.nome}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="private"
                                checked={isPrivate}
                                onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
                            />
                            <Label htmlFor="private" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Dashboard privado
                            </Label>
                        </div>
                    </div>

                    {/* Direita */}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label>Filas</Label>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={qSearch}
                                    onChange={(e) => setQSearch(e.target.value)}
                                    placeholder="Buscar filas…"
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        {queuesLoading ? (
                            <div className="flex items-center gap-2 text-muted-foreground py-6">
                                <Loader2 className="h-4 w-4 animate-spin" /> Carregando filas…
                            </div>
                        ) : queuesError ? (
                            <div className="text-sm text-red-500 py-6">{queuesError}</div>
                        ) : (
                            <div className="max-h-64 overflow-auto rounded-md border p-2 space-y-1">
                                {filteredQueues.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-4 text-center">Nenhuma fila encontrada.</div>
                                ) : (
                                    filteredQueues.map((f) => (
                                        <label key={f.id} className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-muted/50 cursor-pointer">
                                            <Checkbox
                                                checked={selectedFilas.some(sf => sf.id === f.id)}
                                                onCheckedChange={(ck) => toggleFilaSelecionada(f.id, ck)}
                                            />

                                            <div className="flex flex-col flex-1">
                                                <span className="text-sm font-medium">{f.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {f.department ?? "s/ depto"} • {f.strategy ?? "s/ estratégia"}
                                                </span>
                                            </div>

                                            {selectedFilas.some(sf => sf.id === f.id) && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant={selectedFilas.find(sf => sf.id === f.id)?.fila_importante ? "default" : "outline"}
                                                                onClick={() => toggleFilaImportante(f.id)}
                                                            >
                                                                ⭐
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>Definir esta fila como importante</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </label>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {mode === "edit" ? "Salvar alterações" : "Criar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
