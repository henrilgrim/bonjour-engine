import { useRef, useEffect, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessageInputProps {
    onSend: (message: string) => Promise<void>;
    disabled?: boolean;
    placeholder?: string;
}

export function ChatMessageInput({
    onSend,
    disabled = false,
    placeholder = "Mensagem para supervisor...",
}: ChatMessageInputProps) {
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const autosize = () => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
        ta.style.overflowY = ta.scrollHeight > 160 ? "auto" : "hidden";
    };

    const handleSend = async () => {
        const value = draft.trim();
        const ta = textareaRef.current;
        if (!value) {
            ta?.focus();
            return;
        }

        setSending(true);
        try {
            await onSend(value);
            setDraft("");
            requestAnimationFrame(() => {
                ta?.focus();
            });
        } finally {
            setSending(false);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    useEffect(() => {
        autosize();
    }, [draft]);

    useEffect(() => {
        const t = setTimeout(() => textareaRef.current?.focus(), 150);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="border-t bg-background p-3 flex-shrink-0">
            <div className="flex gap-2 items-end">
                <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    disabled={disabled || sending}
                    rows={1}
                    className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleSend}
                    disabled={disabled || sending || !draft.trim()}
                    className="shrink-0 rounded-full p-2"
                >
                    {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
                Enter para enviar • Shift+Enter nova linha
            </p>
        </div>
    );
}