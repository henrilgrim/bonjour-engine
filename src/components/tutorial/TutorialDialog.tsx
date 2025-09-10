import { useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChevronLeft,
    ChevronRight,
    Coffee,
    PhoneCall,
    MessageSquare,
    BarChart3,
    Navigation,
} from "lucide-react";
import { useReasonStore } from "@/store/reasonStore";

interface TutorialStep {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    content:
        | React.ReactNode
        | ((ctx: { reasons: any[]; loading: boolean }) => React.ReactNode);
}
interface TutorialDialogProps {
    open: boolean;
    currentStep: number;
    onNext: () => void;
    onPrev: () => void;
    onSkip: () => void;
    onComplete: () => void;
    onStartTour: () => void;
}

export function TutorialDialog({
    open,
    currentStep,
    onNext,
    onPrev,
    onSkip,
    onComplete,
    onStartTour,
}: TutorialDialogProps) {
    const reasons = useReasonStore((s) => s.reasons);
    const loading = useReasonStore((s) => s.fetching);

    const steps: TutorialStep[] = useMemo(
        () => [
            {
                title: "Bem-vindo ao PXTalk Agent!",
                description:
                    "Vamos te ajudar a conhecer as principais funcionalidades",
                icon: BarChart3,
                content: (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Este é seu painel de controle onde você pode
                            gerenciar pausas, visualizar chamadas e se comunicar
                            com supervisores.
                        </p>
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm font-medium">
                                O que você pode fazer aqui:
                            </p>
                            <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                                <li>• Solicitar pausas quando necessário</li>
                                <li>• Visualizar histórico de chamadas</li>
                                <li>• Chat direto com supervisores</li>
                                <li>• Acompanhar estatísticas do dia</li>
                            </ul>
                        </div>
                    </div>
                ),
            },
            {
                title: "Sistema de Pausas",
                description: "Como solicitar e gerenciar suas pausas",
                icon: Coffee,
                // ✅ Cards compactos + grid fluida
                content: ({
                    reasons,
                    loading,
                }: {
                    reasons: any[];
                    loading: boolean;
                }) => (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            No canto superior direito, você encontra o botão de
                            pausa para solicitar intervalos.
                        </p>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">
                                Motivos de pausa disponíveis:
                            </p>

                            {loading ? (
                                <div className="text-xs text-muted-foreground">
                                    Carregando motivos…
                                </div>
                            ) : reasons?.length ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {reasons.map((r) => (
                                        <div
                                            key={r.id}
                                            className="rounded-lg border bg-card/50 hover:bg-muted/40 transition-colors px-3 py-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span
                                                    className="text-xs font-medium truncate"
                                                    title={r.name}
                                                >
                                                    {r.name}
                                                </span>
                                                {r.needsApproval && (
                                                    <Badge
                                                        variant="destructive"
                                                        className="h-5 px-1.5 text-[10px]"
                                                    >
                                                        Aprovação
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="mt-1 flex items-center justify-between">
                                                <Badge
                                                    variant={
                                                        r.productivePause
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                    className="h-5 px-1.5 text-[10px]"
                                                >
                                                    {r.productivePause
                                                        ? "Produtiva"
                                                        : "Não produtiva"}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                                    {formatSecs(r.timePause)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground">
                                    Nenhum motivo cadastrado.
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Suas pausas serão registradas automaticamente e
                            aparecerão na tabela do painel.
                        </p>
                    </div>
                ),
            },
            {
                title: "Histórico de Chamadas",
                description: "Visualize e gerencie suas chamadas do dia",
                icon: PhoneCall,
                content: (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            A tabela de chamadas mostra todas as ligações
                            realizadas e recebidas durante o dia.
                        </p>
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm font-medium">
                                Informações disponíveis:
                            </p>
                            <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                                <li>• ID da chamada</li>
                                <li>• Origem e destino</li>
                                <li>• Data e hora</li>
                                <li>• Duração da chamada</li>
                                <li>• Status atual</li>
                            </ul>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Use os botões de ação para reproduzir áudios (quando
                            disponível) ou copiar IDs.
                        </p>
                    </div>
                ),
            },
            {
                title: "Chat com Supervisores",
                description: "Comunicação direta e eficiente",
                icon: MessageSquare,
                content: (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            O botão de chat permite comunicação direta com seus
                            supervisores.
                        </p>
                        <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                Recursos do chat:
                            </p>
                            <ul className="mt-2 text-sm text-green-700 dark:text-green-300 space-y-1">
                                <li>• Mensagens em tempo real</li>
                                <li>• Notificações instantâneas</li>
                                <li>• Histórico de conversas</li>
                                <li>• Status de leitura</li>
                            </ul>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Use para dúvidas, suporte ou comunicações
                            importantes durante o expediente.
                        </p>
                    </div>
                ),
            },
        ],
        [reasons, loading]
    );

    const step = steps[currentStep];
    if (!step) return null;

    const Icon = step.icon;
    const isLastStep = currentStep === steps.length - 1;
    const isFirstStep = currentStep === 0;
    const content =
        typeof step.content === "function"
            ? step.content({ reasons, loading })
            : step.content;

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) onSkip();
            }}
        >
            {/* ✅ largura maior */}
            <DialogContent className="max-w-3xl w-[min(92vw,900px)]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg">
                                    {step.title}
                                </DialogTitle>
                                <DialogDescription className="text-sm">
                                    {step.description}
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4">{content}</div>

                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                            {currentStep + 1} de {steps.length}
                        </Badge>
                        <div className="flex gap-1">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-2 w-2 rounded-full transition-colors ${
                                        i === currentStep
                                            ? "bg-primary"
                                            : i < currentStep
                                            ? "bg-primary/50"
                                            : "bg-muted"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isFirstStep && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onPrev}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Anterior
                            </Button>
                        )}

                        {isFirstStep && (
                            <Button variant="ghost" size="sm" onClick={onSkip}>
                                Pular Tutorial
                            </Button>
                        )}

                        {isLastStep ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onComplete}
                                >
                                    Pular Tour
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={onStartTour}
                                    className="bg-gradient-to-r from-primary to-primary/80"
                                >
                                    <Navigation className="h-4 w-4 mr-1" />
                                    Iniciar Tour
                                </Button>
                            </>
                        ) : (
                            <Button
                                size="sm"
                                onClick={onNext}
                                className="bg-gradient-to-r from-primary to-primary/80"
                            >
                                Próximo
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* utils */
function formatSecs(secs: number) {
    if (!secs || secs <= 0) return "Sem tempo";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
