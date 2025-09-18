import { useEffect, useRef } from "react";

interface ChatDialogProps {
    open: boolean;
    onClose: () => void;
    isPaused: boolean;
    children: React.ReactNode;
}

export function ChatDialog({ open, onClose, isPaused, children }: ChatDialogProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const className = isPaused ? "left-4" : "right-4";

    // Close on Escape key
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    // Close on backdrop click
    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (!rootRef.current) return;
            const target = e.target as Node;
            const isInside = rootRef.current.contains(target);
            const isBackdrop =
                (target as HTMLElement)?.dataset?.chatBackdrop === "1";
            if (isBackdrop && !isInside) onClose();
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <>
            <div
                data-chat-backdrop="1"
                className="fixed inset-0 z-[60] bg-black/10 backdrop-blur-[1px] opacity-100 transition-opacity"
                aria-hidden
                style={{ marginTop: 0 }}
            />

            <div
                ref={rootRef}
                className={[
                    "fixed z-[61] bottom-24",
                    "w-[min(92vw,420px)]",
                    "max-h-[80dvh] sm:h-[560px]",
                    "bg-card border rounded-2xl shadow-2xl",
                    "flex flex-col overflow-hidden",
                    "transform transition-all duration-300",
                    "opacity-100 translate-y-0 scale-100",
                    className,
                ].join(" ")}
                role="dialog"
                aria-label="Chat com Supervisor"
            >
                {children}
            </div>
        </>
    );
}