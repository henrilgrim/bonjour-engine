import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type SettingRowProps = {
    id: string
    title: string
    description: string
    checked: boolean
    disabled?: boolean
    onCheckedChange: (enabled: boolean) => void
}

export function SettingRow({ id, title, description, checked, disabled, onCheckedChange }: SettingRowProps) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
                <Label htmlFor={id} className="text-sm font-medium leading-none">
                    {title}
                </Label>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <TooltipProvider>
                <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                        <div>
                            <Switch
                                id={id}
                                checked={checked}
                                onCheckedChange={onCheckedChange}
                                disabled={disabled}
                                className={cn(disabled && "opacity-70")}
                            />
                        </div>
                    </TooltipTrigger>
                    {disabled && (
                        <TooltipContent side="left">
                            Aguarde — salvando ou carregando configurações
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}
