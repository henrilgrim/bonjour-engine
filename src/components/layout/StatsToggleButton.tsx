// components/layout/StatsToggleButton.tsx
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useCoreStore } from "@/store/coreStore";

export default function StatsToggleButton() {
    const isVisible = useCoreStore((s) => s.isStatsVisible);
    const toggle = useCoreStore((s) => s.toggleStats);

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={toggle}
            className="flex items-center gap-2"
            title={isVisible ? "Ocultar estatísticas" : "Mostrar estatísticas"}
        >
            {isVisible ? (
                <ChevronUp className="h-4 w-4" />
            ) : (
                <ChevronDown className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
                {isVisible ? "Ocultar estatísticas" : "Mostrar estatísticas"}
            </span>
        </Button>
    );
}
