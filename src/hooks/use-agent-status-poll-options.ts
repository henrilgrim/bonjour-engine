import { useCallback, useRef, useEffect, useState } from "react";

type UseAgentStatusPollOptions = {
    checkStatusAgent: () => Promise<{
        error: boolean;
        message?: string;
    }>;
    toast: (opts: {
        title: string;
        description?: string;
        variant?: "info" | "success" | "destructive";
    }) => { id: string | number };
    dismiss: (id: string | number) => void;
    pollIntervalMs?: number;
    maxAttempts?: number;
    onSuccess?: () => void;
    onTimeout?: () => void;
    onError?: (err: unknown) => void;
};

export function useAgentStatusPoll({
    checkStatusAgent,
    toast,
    dismiss,
    pollIntervalMs = 3000,
    maxAttempts = 5,
    onSuccess,
    onTimeout,
    onError,
}: UseAgentStatusPollOptions) {
    const ctrlRef = useRef<AbortController | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        return () => {
            if (ctrlRef.current) ctrlRef.current.abort();
        };
    }, []);

    const start = useCallback(async () => {
        if (running) return;
        setRunning(true);
        setAttempt(0);

        const ctrl = new AbortController();
        ctrlRef.current = ctrl;

        const t = toast({
            title: "Conectando às filas...",
            description:
                "Estamos autenticando seu acesso. Isso pode levar alguns segundos.",
            variant: "info",
        });

        try {
            for (let i = 1; i <= maxAttempts; i++) {
                if (ctrl.signal.aborted) break;
                setAttempt(i);

                const res = await checkStatusAgent();
                if (ctrl.signal.aborted) break;

                if (!res.error) {
                    // sucesso → agente logado em todas as filas
                    dismiss(t.id);
                    onSuccess?.();
                    setRunning(false);
                    return true;
                }

                await new Promise((r) => setTimeout(r, pollIntervalMs));
            }

            dismiss(t.id);
            onTimeout?.();
            setRunning(false);
            return false;
        } catch (e) {
            dismiss(t.id);
            onError?.(e);
            setRunning(false);
            return false;
        }
    }, [
        running,
        checkStatusAgent,
        toast,
        dismiss,
        maxAttempts,
        pollIntervalMs,
        onSuccess,
        onTimeout,
        onError,
    ]);

    const cancel = useCallback(() => {
        if (ctrlRef.current) ctrlRef.current.abort();
        setRunning(false);
    }, []);

    return { start, cancel, running, attempt, maxAttempts };
}
