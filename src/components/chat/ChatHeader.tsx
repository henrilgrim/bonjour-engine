import { ArrowLeft, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SupervisorOnline } from "@/hooks/use-firebase-supervisors";

interface ChatHeaderProps {
    showSelector: boolean;
    selectedSupervisor: SupervisorOnline | null;
    isAvailable: boolean;
    onBack: () => void;
    onClose: () => void;
}

export function ChatHeader({
    showSelector,
    selectedSupervisor,
    isAvailable,
    onBack,
    onClose,
}: ChatHeaderProps) {
    return (
        <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
                {!showSelector && selectedSupervisor && (
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onBack}
                        aria-label="Voltar para seleção"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}
                <MessageCircle className="h-5 w-5" />
                <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                        {showSelector
                            ? "Chat com Supervisor"
                            : `Chat com ${
                                  selectedSupervisor?.name || "Supervisor"
                              }`}
                    </span>
                    {!showSelector && !isAvailable && (
                        <span className="text-xs text-muted-foreground">
                            Indisponível
                        </span>
                    )}
                </div>
            </div>
            <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                aria-label="Fechar chat"
            >
                <X className="h-5 w-5" />
            </Button>
        </div>
    );
}