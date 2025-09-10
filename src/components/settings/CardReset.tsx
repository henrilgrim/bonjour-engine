import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RotateCcw, Trash2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type CardResetProps = {
    isClearing: boolean
    clearAllBrowserData: () => void
}

export default function CardReset({ isClearing, clearAllBrowserData }: CardResetProps) {
    return (
        <Card className={cn(
            // levinho no dark, mantendo contraste e borda do tema
            "bg-card/90 border border-border shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80"
        )}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-foreground/80" />
                    Reset da Aplicação
                </CardTitle>
                <CardDescription>Remove dados locais e reinicia o app.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Aviso usa tokens de warning, com alpha diferente para dark */}
                <div
                    className={cn(
                        "rounded-lg p-4 border",
                        "bg-[hsl(var(--warning)/0.12)] border-[hsl(var(--warning)/0.35)]",
                        "dark:bg-[hsl(var(--warning)/0.18)] dark:border-[hsl(var(--warning)/0.35)]"
                    )}
                >
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))] mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium leading-none mb-1">Atenção!</p>
                            <p className="font-medium leading-none">
                                Isto irá remover:
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                                <li>Dados de login e autenticação</li>
                                <li>Configurações personalizadas</li>
                                <li>Cache, localStorage e sessionStorage</li>
                                <li>IndexedDB</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                        Essa ação é irreversível. Você será desconectado e o app recarregado.
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                className="gap-2"
                                disabled={isClearing}
                            >
                                {isClearing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Limpando...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4" />
                                        Limpar todos os dados
                                    </>
                                )}
                            </Button>
                        </AlertDialogTrigger>

                        {/* garante contraste da modal no dark */}
                        <AlertDialogContent className="bg-card text-card-foreground border-border">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar limpeza</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tem certeza que deseja apagar todos os dados da aplicação?
                                    Essa ação é irreversível e você será desconectado.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={clearAllBrowserData}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Sim, limpar tudo
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    )
}
