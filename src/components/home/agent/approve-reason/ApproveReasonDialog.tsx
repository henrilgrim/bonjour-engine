import { useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { hslVar } from "@/utils/home";
import { useAuthStore } from "@/store/authStore";
import { usePauseRequests } from "@/hooks/use-pause-requests";
import {
    badgeTone,
    PauseRequest,
    PresenceDot,
    REJECTION_REASONS,
    toDateSafe,
} from "./helpers";
import { SinglePauseRequest } from "./SinglePauseRequest";
import { Skeleton } from "@/components/ui/skeleton";
import type { PauseRequestList as PauseRequestType } from "@/lib/firebase/firestore/profile/agents/types";
import { PauseRequestList } from "./PauseRequestList";
import { AgentView } from "@/hooks/use-realtime-agents";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AgentApproveReasonDialogProps {
    agent: AgentView;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectedChange?: (selected: boolean) => void;

    requests?: PauseRequest[];
}

export default function AgentApproveReasonDialog({
    agent,
    open,
    onOpenChange,
    onSelectedChange,
}: AgentApproveReasonDialogProps) {
    const accountcode = useAuthStore((s) => s.company?.accountcode || "");

    const {
        request,
        loading,
        error,
        approveRequest,
        rejectRequest,
        agentListRequest,
    } = usePauseRequests({
        agentId: agent.login,
        accountcode,
    });

    const [history, setHistory] = useState<PauseRequestType[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(
        null
    );

    const statusKey = (request?.status ?? "pending") as
        | "pending"
        | "approved"
        | "rejected";

    const createdAt = useMemo(
        () => toDateSafe(request?.createdAt),
        [request?.createdAt]
    );

    const handleClose = () => {
        onOpenChange(false);
        onSelectedChange?.(false);
    };

    const handleApprove = async () => {
        if (!request) return;
        setSubmitting("approve");
        try {
            await approveRequest();
            handleClose();
        } finally {
            setSubmitting(null);
        }
    };

    const handleReject = async () => {
        if (!request || !rejectReason.trim()) return;
        setSubmitting("reject");
        try {
            await rejectRequest(rejectReason.trim());
            setRejectOpen(false);
            setRejectReason("");
            handleClose();
        } finally {
            setSubmitting(null);
        }
    };

    useEffect(() => {
        if (!open) return;
        const loadHistory = async () => {
            setLoadingHistory(true);
            try {
                const list = await agentListRequest(agent.idAgentDb);
                setHistory(list);
            } finally {
                setLoadingHistory(false);
            }
        };
        loadHistory();
    }, [open, agent.login, agentListRequest]);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-[900px] h-[600px] max-w-none p-0 flex flex-col overflow-hidden overflow-y-auto">
                <Tabs defaultValue="current" className="flex flex-col flex-1">
                    {/* HEADER */}
                    <DialogHeader className="sticky top-0 z-20 px-6 py-4 border-b bg-card/80 backdrop-blur">
                        <div className="flex items-center justify-between gap-3">
                            {/* Info do agente */}
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="relative">
                                    <div
                                        className="grid place-items-center h-11 w-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-sm font-semibold"
                                        aria-label={`Avatar de ${
                                            agent.displayName || agent.login
                                        }`}
                                    >
                                        {(agent.displayName || agent.login)
                                            ?.slice(0, 2)
                                            ?.toUpperCase()}
                                    </div>
                                    <PresenceDot status={agent.status} />
                                </div>

                                <div className="min-w-0">
                                    <DialogTitle className="text-base font-semibold leading-tight truncate">
                                        {agent.displayName || agent.login}
                                    </DialogTitle>

                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <span
                                                className="h-2 w-2 rounded-full"
                                                style={{
                                                    backgroundColor: hslVar(
                                                        agent.color
                                                    ),
                                                }}
                                            />
                                            {agent.queueName || "Sem fila"}
                                        </span>
                                        <span className="opacity-50">•</span>
                                        <span title="Login">{agent.login}</span>
                                        {agent.ramal && (
                                            <>
                                                <span className="opacity-50">
                                                    •
                                                </span>
                                                <span title="Ramal">
                                                    ramal {agent.ramal}
                                                </span>
                                            </>
                                        )}
                                        <span
                                            className={[
                                                "ml-1 inline-flex items-center rounded-full px-2 py-0.5 border text-[11px] leading-none",
                                                badgeTone(agent.status),
                                            ].join(" ")}
                                        >
                                            {agent.status}
                                        </span>
                                    </div>

                                    <DialogDescription className="mt-0.5 text-[11px] text-muted-foreground/80">
                                        Última atividade:{" "}
                                        {new Date(
                                            agent.dataevento
                                        ).toLocaleString("pt-BR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            day: "2-digit",
                                            month: "2-digit",
                                        })}
                                    </DialogDescription>
                                </div>
                            </div>

                            {/* Tabs + botão fechar */}
                            <div className="flex items-center gap-3 shrink-0">
                                <TabsList>
                                    <TabsTrigger value="current">
                                        Solicitação Atual
                                    </TabsTrigger>
                                    <TabsTrigger value="history">
                                        Histórico
                                    </TabsTrigger>
                                </TabsList>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={handleClose}
                                >
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* BODY */}
                    <div className="flex-1 px-6 py-4 min-h-0">
                        <TabsContent value="current" className="h-full">
                            <div className="flex items-center justify-center h-full">
                                <SinglePauseRequest
                                    request={request}
                                    loading={loading}
                                    error={error}
                                    statusKey={statusKey}
                                    createdAt={createdAt}
                                    submitting={submitting}
                                    onApprove={handleApprove}
                                    onRejectOpen={() => setRejectOpen(true)}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="h-full">
                            <PauseRequestList requests={history} />
                        </TabsContent>
                    </div>
                </Tabs>

                {/* REJECT DIALOG (inline) */}
                <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-rose-500" />
                                Rejeitar Solicitação
                            </DialogTitle>
                            <DialogDescription>
                                Informe o motivo da rejeição para{" "}
                                <strong>{agent.displayName}</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                    Motivo
                                </label>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    {REJECTION_REASONS.map((r) => (
                                        <Badge
                                            key={r}
                                            onClick={() => setRejectReason(r)}
                                            className={
                                                "cursor-pointer justify-center " +
                                                (rejectReason === r
                                                    ? "bg-primary text-primary-foreground"
                                                    : "border")
                                            }
                                            variant={
                                                rejectReason === r
                                                    ? "default"
                                                    : "outline"
                                            }
                                        >
                                            {r}
                                        </Badge>
                                    ))}
                                </div>
                                <Textarea
                                    placeholder="Ou descreva um motivo personalizado..."
                                    value={rejectReason}
                                    onChange={(e) =>
                                        setRejectReason(e.target.value)
                                    }
                                    className="min-h-[80px]"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setRejectOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleReject}
                                disabled={
                                    !rejectReason.trim() ||
                                    submitting === "reject"
                                }
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                            >
                                {submitting === "reject"
                                    ? "Rejeitando..."
                                    : "Rejeitar"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}
