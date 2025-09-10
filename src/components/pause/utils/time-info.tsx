import { cn } from "@/lib/utils";

export function TimeInfo({ labelColor, pauseTime, pauseDuration, timeExceededBy, formatTime }: any) {
    return (
        <div className="bg-muted/50 dark:bg-muted/10 p-3 rounded-md border border-border space-y-1 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Tempo permitido:</span>
                <span className="font-medium">{formatTime(pauseDuration)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Tempo atual:</span>
                <span className={cn("font-medium", labelColor)}>{formatTime(pauseTime)}</span>
            </div>
        </div>
    )
}