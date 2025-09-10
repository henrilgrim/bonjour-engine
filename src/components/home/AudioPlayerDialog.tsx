import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Loader2, Save, Info } from "lucide-react"
import { useFirebaseProfile } from "@/hooks/use-firebase-profile"
import { toast } from "sonner"
import { useAppStore } from "@/store/appStore"

type AudioPlayerDialogProps = {
    open: boolean
    id?: string
    src?: string | null
    loading?: boolean
    error?: string | null
    onClose: () => void
    className?: string
    onHeard?: (id: string) => void
    minSecondsToMarkHeard?: number
}

export function AudioPlayerDialog({
    open, src, id, loading, error, onClose, className, onHeard, minSecondsToMarkHeard = 3
}: AudioPlayerDialogProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [playedSeconds, setPlayedSeconds] = useState(0)
    const [notes, setNotes] = useState("")
    const [loadingNote, setLoadingNote] = useState(false)
    const [savingNote, setSavingNote] = useState(false)
    const [audioAlreadyListened, setAudioAlreadyListened] = useState(false)
    const [isArmed, setIsArmed] = useState(false) // usuário autorizou tocar?

    const { getCallNote, setCallNote } = useFirebaseProfile()
    const alreadyHeard = useAppStore(s => s.alreadyHeard)

    useEffect(() => {
        if (!open || !id) return

        setLoadingNote(true)
        let find = alreadyHeard.find(a => a === id)
        setAudioAlreadyListened(Boolean(find))

        getCallNote(id)
            .then(note => setNotes(note?.notes || ""))
            .finally(() => setLoadingNote(false))
    }, [open, id, getCallNote, alreadyHeard])


    // Observa tempo/ended (aqui tanto faz se já foi ouvido; não haverá <audio> renderizado)
    useEffect(() => {
        const a = audioRef.current
        if (!a) return
        const handleTimeUpdate = () => setPlayedSeconds(a.currentTime || 0)
        const handleEnded = () => { if (id && onHeard) onHeard(id) }

        a.addEventListener("timeupdate", handleTimeUpdate)
        a.addEventListener("ended", handleEnded)
        return () => {
            a.removeEventListener("timeupdate", handleTimeUpdate)
            a.removeEventListener("ended", handleEnded)
        }
    }, [id, onHeard])

    const handleUserPlay = async () => {
        if (!src || audioAlreadyListened) return
        setIsArmed(true)               // libera o <source>
        const a = audioRef.current
        try {
            a?.load()
            await a?.play()
        } catch {
            // ignorar erro de autoplay bloqueado — o usuário já clicou, então raramente acontece
        }
    }


    const handleSaveNote = async () => {
        if (!id) return
        setSavingNote(true)
        try {
            await setCallNote(id, notes)
            toast.success("Nota salva com sucesso!")
        } catch (error) {
            toast.error("Erro ao salvar nota")
            console.error("Erro ao salvar nota:", error)
        } finally {
            setSavingNote(false)
        }
    }

    const handleClose = () => {
        const a = audioRef.current
        if (a) {
            try {
                a.pause()
                a.currentTime = 0
            } catch { }
        }
        if (id && onHeard && playedSeconds >= minSecondsToMarkHeard) {
            onHeard(id)
        }
        onClose()
        setPlayedSeconds(0)
        setNotes("")
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
            <DialogContent className={cn("sm:max-w-2xl", className)}>
                <DialogHeader>
                    <DialogTitle>Análise de Áudio</DialogTitle>
                    <DialogDescription>Você está no ticket {id}.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {audioAlreadyListened ? (
                        <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm">
                            <Info className="h-4 w-4 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium">Áudio já ouvido</p>
                                <p className="text-muted-foreground">
                                    Este áudio já foi reproduzido anteriormente. Reproduções adicionais foram desativadas.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {loading ? (
                                <div className="flex items-center gap-2 py-6 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Carregando áudio...
                                </div>
                            ) : error ? (
                                <div className="text-sm text-red-600 py-4">{error}</div>
                            ) : (
                                <div className="space-y-2">
                                    <audio
                                        ref={audioRef}
                                        style={{ width: "100%" }}
                                        controls
                                        preload="none"             // <-- evita pré-carregar
                                    >
                                        {isArmed && src ? <source src={src} /> : null} {/* só injeta src após clique */}
                                        Seu navegador não suporta o elemento de áudio.
                                    </audio>

                                    {/* Botão de ação explícita do usuário */}
                                    {!isArmed && (
                                        <Button size="sm" onClick={handleUserPlay} disabled={!src}>
                                            Reproduzir
                                        </Button>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Notas – continuam disponíveis mesmo se já foi ouvido */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="notes">Anotações do Áudio</Label>
                            {loadingNote && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Digite suas anotações sobre este áudio..."
                            rows={4}
                            disabled={loadingNote}
                        />
                    </div>
                </div>

                <DialogFooter className="space-x-2 flex items-center">
                    <Button onClick={handleSaveNote} disabled={savingNote || !id} size="sm" className="w-fit">
                        {savingNote ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Salvar Nota
                            </>
                        )}
                    </Button>
                    <Button variant="outline" onClick={handleClose}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
