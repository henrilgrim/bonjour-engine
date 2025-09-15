import { Badge } from "@/components/ui/badge";
import { PauseCircle } from "lucide-react";
import {
    formatDateTime,
    statusBadgeTone,
    statusLabel,
    toDateSafe,
} from "./helpers";
import type { PauseRequestList as PauseRequestType } from "@/lib/firebase/firestore/profile/agents/types";

export function PauseRequestList({
    requests,
}: {
    requests: PauseRequestType[];
}) {
    if (requests.length === 0) {
        return (
            <div className="h-full grid place-items-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2 text-center">
                    <PauseCircle className="h-10 w-10 mb-2 opacity-70" />
                    <p className="text-sm">Nenhuma solicitação registrada.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 min-h-0 ">
            {requests.map((r, idx) => (
                <div
                    key={idx}
                    className="rounded-xl border bg-card/50 shadow-sm hover:shadow-md transition-shadow p-4"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm text-foreground">
                                {r.reasonName || "Motivo não informado"}
                            </span>
                            {r.rejectionReason && (
                                <span className="text-xs text-muted-foreground mt-1 italic">
                                    Rejeição: {r.rejectionReason}
                                </span>
                            )}
                        </div>
                        <Badge
                            className={`${statusBadgeTone(
                                r.status as any
                            )} text-xs px-2 py-0.5`}
                        >
                            {statusLabel(r.status as any)}
                        </Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-y-1 text-xs text-muted-foreground font-mono">
                        <div>
                            <span className="block opacity-70">Criado</span>
                            {formatDateTime(toDateSafe(r.createdAt))}
                        </div>
                        <div>
                            <span className="block opacity-70">Atualizado</span>
                            {formatDateTime(toDateSafe(r.updatedAt))}
                        </div>
                        <div>
                            <span className="block opacity-70">Por</span>
                            {r.nameWhoResponded || "—"}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
