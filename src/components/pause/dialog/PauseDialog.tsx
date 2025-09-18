import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogOverlay,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Loader2,
    ShieldAlert,
    Timer,
    CheckCircle2,
    CircleX,
    AlertCircle,
    RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { fmtDuration } from "../utils";
import type { PauseDialogProps } from "../types";

import { useReasonStore } from "@/store/reasonStore";
import { useAppStore } from "@/store/appStore";

export function PauseDialog({ open, setOpen }: PauseDialogProps) {
    const actualStateExtension = useAppStore((s) => s.actualStateExtension);
    const {
        fetchReasons,
        reasons,
        loading,
        starting,
        selectedReason,
        setSelectedReason,
        startPause,
    } = useReasonStore();

    useEffect(() => {
        if (open) {
            fetchReasons();
        }
        if (!open) setSelectedReason("");
    }, [open, fetchReasons, setSelectedReason]);

    const statusStr =
        typeof actualStateExtension?.status === "string"
            ? actualStateExtension.status
            : "";
    const releasedToPause = statusStr.includes("OK");
    const canInteract = releasedToPause && !starting;

    const handleSelectReason = (id: string) => {
        if (!canInteract) return;
        setSelectedReason(id);
    };

    const handleStart = async () => {
        if (!selectedReason || !canInteract) return;
        await startPause(selectedReason);
        setOpen(false);
    };

    const checkStatusExtensionAgain = async () => {
        await useAppStore.getState().checkExtensionStatus?.();
    };

    const list = reasons ?? [];

    return (
        <Dialog open={open}>
            <DialogOverlay className="bg-black/10 backdrop-blur-[1px] opacity-100 transition-opacity" />
            <DialogContent className="sm:max-w-[980px] ">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="relative">
                            <DialogTitle className="flex items-center gap-2">
                                Iniciar Pausa
                            </DialogTitle>
                            <DialogDescription>
                                Selecione um motivo para iniciar sua pausa.
                            </DialogDescription>
                        </div>
                    </div>

                    {!releasedToPause && (
                        <div className="mt-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
                            <AlertCircle className="h-4 w-4" />

                            <span className="text-sm font-medium">
                                Ramal indisponível no momento. Verifique sua
                                conexão/registro para iniciar uma pausa.
                            </span>
                        </div>
                    )}
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto nice-scroll space-y-4 py-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-10 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Carregando motivos...
                        </div>
                    ) : list.length === 0 ? (
                        <div className="py-10 text-center text-muted-foreground">
                            Nenhum motivo disponível.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {list.map((r, index) => {
                                const selected = selectedReason === r.id;
                                return (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => handleSelectReason(r.id)}
                                        disabled={!canInteract}
                                        className={cn(
                                            "text-left rounded-xl border p-4 bg-card transition-colors",
                                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                            selected
                                                ? "border-primary ring-2 ring-primary/30"
                                                : "border-border hover:bg-muted/40",
                                            !canInteract &&
                                                "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="font-semibold">
                                                    {r.name}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {r.productivePause ? (
                                                        <Badge className="gap-1">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            Produtiva
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="secondary"
                                                            className="gap-1"
                                                        >
                                                            <CircleX className="h-3.5 w-3.5" />
                                                            Não produtiva
                                                        </Badge>
                                                    )}

                                                    <Badge
                                                        variant="outline"
                                                        className="gap-1"
                                                    >
                                                        <Timer className="h-3.5 w-3.5" />
                                                        {fmtDuration(
                                                            r.timePause
                                                        )}
                                                    </Badge>

                                                    {r.needsApproval && (
                                                        <Badge
                                                            variant="destructive"
                                                            className="gap-1"
                                                        >
                                                            <ShieldAlert className="h-3.5 w-3.5" />
                                                            Requer aprovação
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <div
                                                className={cn(
                                                    "h-4 w-4 rounded-full border",
                                                    selected
                                                        ? "bg-primary border-primary"
                                                        : "bg-transparent border-muted-foreground/40"
                                                )}
                                                aria-hidden
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <Separator />

                <DialogFooter className="gap-2">
                    {!canInteract && (
                        <Button
                            variant="secondary"
                            onClick={checkStatusExtensionAgain}
                        >
                            <RefreshCcw className="h-4 w-4 mr-1" />
                            Verificar status novamente
                        </Button>
                    )}

                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>

                    <Button
                        onClick={handleStart}
                        disabled={!selectedReason || !canInteract}
                    >
                        {starting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Iniciando…
                            </>
                        ) : (
                            "Iniciar Pausa"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
