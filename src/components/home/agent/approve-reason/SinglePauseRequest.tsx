import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "./Subcomponentes";
import {
    formatDateTime,
    formatTimeAgo,
    statusBadgeTone,
    statusLabel,
} from "./helpers";

export function SinglePauseRequest({
    request,
    loading,
    error,
    statusKey,
    createdAt,
    submitting,
    onApprove,
    onRejectOpen,
}: {
    request: any;
    loading: boolean;
    error: unknown;
    statusKey: "pending" | "approved" | "rejected";
    createdAt: Date;
    submitting: "approve" | "reject" | null;
    onApprove: () => void;
    onRejectOpen: () => void;
}) {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} />;
    if (!request) return <EmptyState />;

    const StatusIcon =
        statusKey === "approved"
            ? CheckCircle
            : statusKey === "rejected"
            ? XCircle
            : Clock;

    return (
        <Card className="w-full max-w-md mx-auto shadow-md border">
            <CardHeader className="flex flex-col items-center text-center">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-muted mb-3">
                    <StatusIcon className="w-7 h-7 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg font-semibold">
                    Solicitação de Pausa
                </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center text-center gap-3">
                <div className="flex flex-wrap justify-center gap-2">
                    {request.reasonName && <Badge>{request.reasonName}</Badge>}
                    <Badge className={statusBadgeTone(statusKey)}>
                        {statusLabel(statusKey)}
                    </Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                    Registrada {formatTimeAgo(createdAt)}
                    <time
                        dateTime={createdAt.toISOString()}
                        className="block mt-1 text-xs opacity-70"
                    >
                        ({formatDateTime(createdAt)})
                    </time>
                </p>
            </CardContent>

            {statusKey === "pending" && (
                <CardFooter className="flex justify-center gap-3">
                    <Button
                        onClick={onApprove}
                        disabled={submitting === "approve"}
                        variant="default"
                        className="px-5"
                    >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {submitting === "approve" ? "Aprovando..." : "Aprovar"}
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={onRejectOpen}
                        disabled={submitting === "reject"}
                        className="px-5"
                    >
                        <XCircle className="w-4 h-4 mr-1" />
                        {submitting === "reject" ? "Rejeitando..." : "Rejeitar"}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
