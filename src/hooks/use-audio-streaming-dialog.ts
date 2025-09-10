import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";

type UseAudioStreamingDialogOptions = {
    /** chamado após abrir com sucesso – ex: marcar como ouvido */
    onAlreadyHeard?: (ticketId: string) => void;
};

export function useAudioStreamingDialog(
    options?: UseAudioStreamingDialogOptions
) {
    const { toast } = useToast();
    const accountcode = useAppStore((s) => s.company?.accountcode);
    const token = useAuthStore((s) => (s as any).token ?? s.user?.token);

    const [open, setOpen] = useState(false);
    const [src, setSrc] = useState<string | null>(null);
    const [title, setTitle] = useState<string>("Ouvir Áudio");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const currentTicketIdRef = useRef<string | null>(null);

    // cleanup URL quando trocar/fechar
    useEffect(() => {
        return () => {
            if (src) {
                try {
                    URL.revokeObjectURL(src);
                } catch {}
            }
        };
    }, [src]);

    const close = useCallback(() => {
        setOpen(false);
        if (src) {
            try {
                URL.revokeObjectURL(src);
            } catch {}
        }
        setSrc(null);
        setLoading(false);
        setError(null);
        currentTicketIdRef.current = null;
    }, [src]);

    const resolveApiBase = () => {
        // suporta Vite, CRA, Next
        return import.meta.env.VITE_API_URL_PXTALK;
    };

    const openForTicket = useCallback(
        async (ticketId: string, customTitle?: string) => {
            setLoading(true);
            setError(null);
            setTitle(customTitle || "Ouvir Áudio");
            currentTicketIdRef.current = ticketId;

            const baseUrl = resolveApiBase();
            const url = `${baseUrl}/painel-agents/streaming-ticket-by-id?ticket_id=${ticketId}&accountcode=${accountcode}`;

            try {
                const res = await fetch(url, {
                    headers: { Authorization: `bearer ${token}` },
                });

                if (res.status === 400) {
                    const payload = await res.json().catch(() => null);
                    const details =
                        payload?.details || "Problemas com esse áudio.";
                    setError(details);
                    toast({
                        title: "Não foi possível reproduzir",
                        description: details,
                        variant: "warning",
                    });
                    setLoading(false);
                    return;
                }

                if (!res.ok) {
                    throw new Error(
                        `Falha ao baixar áudio (HTTP ${res.status})`
                    );
                }

                const blob = await res.blob();

                if (src) {
                    try {
                        URL.revokeObjectURL(src);
                    } catch {}
                }
                const objectUrl = URL.createObjectURL(blob);
                setSrc(objectUrl);
                setOpen(true);
                setLoading(false);

                // callback externo
                if (options?.onAlreadyHeard) {
                    try {
                        options.onAlreadyHeard(ticketId);
                    } catch {}
                }
            } catch (err: any) {
                console.error("Erro ao obter áudio:", err);
                setError(err?.message || "Erro ao baixar áudio.");
                setLoading(false);
                toast({
                    title: "Erro ao baixar áudio",
                    description:
                        err?.message || "Tente novamente em instantes.",
                    variant: "destructive",
                });
            }
        },
        [accountcode, token, src, toast, options]
    );

    return {
        // state
        open,
        src,
        title,
        loading,
        error,
        // actions
        openForTicket,
        close,
        setTitle,
    };
}
