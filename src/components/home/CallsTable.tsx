import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    PhoneCall,
    Play,
    Pause,
    Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TicketData } from "@/types";
import { cn } from "@/lib/utils";
import { useAudioStreamingDialog } from "@/hooks/use-audio-streaming-dialog";
import { AudioPlayerDialog } from "@/components/home/AudioPlayerDialog";
import { useAppStore } from "@/store/appStore";

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface CallsTableProps {
    tickets: TicketData[];
    pagination: Pagination;
    onPageChange: (page: number) => void;
}

export function CallsTable({
    tickets,
    pagination,
    onPageChange,
}: CallsTableProps) {
    const { toast } = useToast();
    const [ticketSelected, setTicketSelected] = useState<TicketData | null>(
        null
    );

    const alreadyHeard = useAppStore((s) => s.alreadyHeard);
    const setAlreadyHeard = useAppStore((s) => s.setAlreadyHeard);

    const { open, src, loading, error, openForTicket, close } =
        useAudioStreamingDialog();

    const handlePlay = (ticketId: string) => {
        setTicketSelected(tickets.find((t) => t.id === ticketId) || null);
        openForTicket(ticketId);
    };

    const formatDuration = (seconds: number) => {
        const s = Math.max(0, Math.floor(Number(seconds) || 0));
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr.replace(" ", "T"));
        if (isNaN(d.getTime())) return dateStr;

        const time = d.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        });
        const date = d.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

        return `${time}, ${date}`;
    };

    const handleCopy = async (id: string) => {
        try {
            await navigator.clipboard.writeText(String(id));
            toast({
                title: "Copiado!",
                description: `ID ${id} copiado para a área de transferência.`,
            });
        } catch {
            toast({
                title: "Erro",
                description: "Não foi possível copiar o ID.",
                variant: "destructive",
            });
        }
    };

    const statusCell = (t: TicketData) => {
        const color = String(t?.status?.color ?? "#9e9e9e");
        const text = String(t?.status?.text ?? "—");
        return (
            <span className="font-medium truncate block" style={{ color }}>
                {text}
            </span>
        );
    };

    const canPrev = useMemo(() => pagination.page > 1, [pagination.page]);
    const canNext = useMemo(
        () => pagination.page < pagination.totalPages,
        [pagination.page, pagination.totalPages]
    );

    return (
        <Card
            className={cn(
                "guide--container-table-calls flex flex-col overflow-hidden",
                "max-h-[calc(100vh-180px)]"
            )}
        >
            <CardHeader className="shrink-0 pb-4 px-6 pt-6">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
                        <PhoneCall className="h-5 w-5 text-primary" />
                    </div>
                    <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                        Chamadas Hoje
                    </span>
                </CardTitle>
            </CardHeader>

            {/* ❗️ min-h-0 aqui é crucial num flex-col */}
            <CardContent className="flex-1 min-h-0 p-0 flex flex-col">
                {/* Wrapper com scroll Y e X independentes */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto nice-scroll">
                    <Table className="min-w-full">
                        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b">
                            <TableRow>
                                <TableHead className="w-16 text-xs text-center">
                                    ID
                                </TableHead>
                                <TableHead className="w-20 text-xs text-center">
                                    Origem
                                </TableHead>
                                <TableHead className="w-20 text-xs text-center">
                                    Destino
                                </TableHead>
                                <TableHead className="w-32 text-xs text-center">
                                    Data/Hora
                                </TableHead>
                                <TableHead className="w-16 text-xs text-center">
                                    Duração
                                </TableHead>
                                <TableHead className="w-28 text-xs text-center">
                                    Status
                                </TableHead>
                                <TableHead className="w-28 text-xs text-center">
                                    Ações
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {(tickets?.length ?? 0) === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <div className="flex flex-col items-center justify-center py-14 text-muted-foreground space-y-2">
                                            <PhoneCall className="h-12 w-12 text-blue-500 animate-pulse" />
                                            <p className="text-sm font-medium">
                                                Nenhuma chamada encontrada
                                            </p>
                                            <p className="text-xs text-center max-w-[260px]">
                                                As chamadas do dia serão
                                                listadas aqui conforme forem
                                                realizadas ou recebidas.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tickets.map((ticket) => {
                                    const duration = formatDuration(
                                        Number(ticket.duration) || 0
                                    );
                                    return (
                                        <TableRow
                                            key={ticket.id}
                                            className="hover:bg-muted/40"
                                        >
                                            <TableCell
                                                className="font-medium max-w-[150px] truncate"
                                                title={String(ticket.id)}
                                            >
                                                {ticket.id}
                                            </TableCell>
                                            <TableCell className="text-center font-medium text-foreground/80 truncate">
                                                {ticket.origin}
                                            </TableCell>
                                            <TableCell className="text-center font-medium text-foreground/80 truncate">
                                                {ticket.destination}
                                            </TableCell>
                                            <TableCell
                                                className="text-center font-mono text-foreground/80 truncate"
                                                title={ticket.dateAndHour}
                                            >
                                                {formatDateTime(
                                                    ticket.dateAndHour
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-foreground/80">
                                                {duration}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {statusCell(ticket)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="inline-flex gap-2 items-center">
                                                    <Button
                                                        size="icon"
                                                        variant={
                                                            ticket.hasAudio &&
                                                            ticket.destination !==
                                                                "URA"
                                                                ? "outline"
                                                                : "ghost"
                                                        }
                                                        className={`h-7 w-7 ${
                                                            alreadyHeard.includes(
                                                                ticket.id
                                                            )
                                                                ? "text-green-600 text-xs font-medium"
                                                                : ""
                                                        }`}
                                                        onClick={() =>
                                                            handlePlay(
                                                                ticket.id
                                                            )
                                                        }
                                                        disabled={
                                                            !ticket.hasAudio ||
                                                            ticket.destination ===
                                                                "URA"
                                                        }
                                                    >
                                                        <Play className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-7 w-7"
                                                        onClick={() =>
                                                            handleCopy(
                                                                String(
                                                                    ticket.id
                                                                )
                                                            )
                                                        }
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginação presa embaixo */}
                {pagination.totalPages > 1 && (
                    <div className="shrink-0 flex items-center justify-between p-3 border-t bg-muted/20">
                        <div className="text-xs text-muted-foreground">
                            Página {pagination.page} de {pagination.totalPages}{" "}
                            ({pagination.total} itens)
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    onPageChange(pagination.page - 1)
                                }
                                disabled={!canPrev}
                                className="h-7 w-7 p-0"
                            >
                                <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    onPageChange(pagination.page + 1)
                                }
                                disabled={!canNext}
                                className="h-7 w-7 p-0"
                            >
                                <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>

            <AudioPlayerDialog
                open={open}
                id={ticketSelected?.id}
                src={src}
                loading={loading}
                error={error}
                onClose={close}
                onHeard={(heardId) => setAlreadyHeard(heardId)}
            />
        </Card>
    );
}
