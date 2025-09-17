import { AlertCircle, Clock, PauseCircle } from "lucide-react";

export function LoadingState() {
    return (
        <div className="h-full grid place-items-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2 text-center">
                <Clock className="h-6 w-6 animate-spin" />
                <p className="text-sm">Carregando solicitação...</p>
            </div>
        </div>
    );
}

export function ErrorState({ error }: { error: unknown }) {
    return (
        <div className="h-full grid place-items-center text-destructive">
            <div className="flex flex-col items-center gap-2 text-center">
                <AlertCircle className="h-10 w-10 mb-2 opacity-70" />
                <p className="text-sm">{String(error)}</p>
            </div>
        </div>
    );
}

export function EmptyState() {
    return (
        <div className="h-full grid place-items-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2 text-center">
                <PauseCircle className="h-10 w-10 mb-2 opacity-70" />
                <p className="text-sm">Sem solicitação de pausa no momento.</p>
            </div>
        </div>
    );
}
