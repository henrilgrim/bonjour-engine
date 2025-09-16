import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { useMonitoringDashStore } from "@/store/monitoringDashStore"
import { TransformedQueue } from "@/utils/transform-queue-monitoting"
import { useToast } from "@/hooks/use-toast"
import { updateFilaConfig } from "@/lib/firebase/firestore/dashboard"
// import { updateFilaConfig } from "@/lib/repos/monitoring-dash-repo"

interface QueueConfigDialogProps {
    fila: TransformedQueue
    filaNome: string
    onSave: (filaId: string, config: TransformedQueue["configuracao"]) => void
}

const Dot = ({ colorVar }: { colorVar: string }) => (
    <span aria-hidden className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle" style={{ backgroundColor: `hsl(var(--${colorVar}))` }} />
)

export default function QueueConfigDialog({ fila, filaNome, onSave }: QueueConfigDialogProps) {
    const [open, setOpen] = useState(false)

    // agora só dois limiares
    const [alerta, setAlerta] = useState(fila?.configuracao?.estados?.alerta || "70")
    const [critico, setCritico] = useState(fila?.configuracao?.estados?.critico || "100")

    const [filaImportante, setFilaImportante] = useState(fila?.configuracao?.fila_importante || false)
    const { dashSelected } = useMonitoringDashStore()
    const { toast } = useToast()

    const handleSave = () => {
        if (!dashSelected?.id || !fila.id) {
            console.error("Dashboard ou fila inválidos")
            return toast({ variant: "destructive", title: "Erro", description: "Dashboard ou fila inválidos" })
        }

        const a = Number(alerta)
        const c = Number(critico)

        // validação: números e ordem correta
        if (![a, c].every(n => Number.isFinite(n))) {
            return toast({ variant: "destructive", title: "Valores inválidos", description: "Use números entre 0 e 100." })
        }
        if (a < 0 || a > 100 || c < 0 || c > 100) {
            return toast({ variant: "destructive", title: "Fora do intervalo", description: "Os valores devem estar entre 0 e 100." })
        }
        if (!(a < c)) {
            return toast({
                variant: "destructive",
                title: "Regra não atendida",
                description: "É necessário garantir: 0 ≤ Alerta < Crítico ≤ 100."
            })
        }

        const dashId = dashSelected.id

        updateFilaConfig(dashSelected.accountcode, dashId, fila.id, {
            estados: { alerta: String(a), critico: String(c) },
            fila_importante: filaImportante
        })

        onSave(fila.id, {
            estados: { alerta: String(a), critico: String(c) },
            fila_importante: filaImportante
        })

        toast({ title: "Configurações salvas", description: `Fila “${filaNome}” atualizada.` })
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="ml-2 text-foreground hover:text-foreground" aria-label={`Configurar fila ${filaNome}`}>
                    <Settings className="h-4 w-4" />
                </button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Configuração da Fila: {filaNome}</DialogTitle>
                    <DialogDescription asChild>
                        <div className="space-y-2">
                            <p>Defina os limites de ocupação por porcentagem.</p>

                            <div className="rounded-md border p-3 text-xs leading-relaxed bg-muted/50">
                                <div className="font-medium mb-1">Como funciona:</div>
                                <ul className="space-y-1">
                                    <li><Dot colorVar="traffic-green" /><b>Verde</b>: abaixo de <b>Alerta</b></li>
                                    <li><Dot colorVar="traffic-yellow" /><b>Amarelo</b>: a partir de <b>Alerta</b></li>
                                    <li><Dot colorVar="traffic-red" /><b>Vermelho</b>: a partir de <b>Crítico</b></li>
                                </ul>
                                <div className="mt-2 text-muted-foreground">
                                    Regra: <code className="px-1 rounded bg-background">0 ≤ Alerta &lt; Crítico ≤ 100</code>
                                </div>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Alerta (%)</label>
                            <Input
                                value={alerta}
                                onChange={(e) => setAlerta(e.target.value)}
                                inputMode="numeric"
                                placeholder="70"
                                aria-label="Limite de alerta em porcentagem"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Crítico (%)</label>
                            <Input
                                value={critico}
                                onChange={(e) => setCritico(e.target.value)}
                                inputMode="numeric"
                                placeholder="100"
                                aria-label="Limite crítico em porcentagem"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={filaImportante}
                            onCheckedChange={(ck) => setFilaImportante(!!ck)}
                            id="fila_importante"
                        />
                        <label htmlFor="fila_importante" className="text-sm">Fila importante</label>
                    </div>

                    <Button onClick={handleSave} className="w-full">
                        Salvar Configuração
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
