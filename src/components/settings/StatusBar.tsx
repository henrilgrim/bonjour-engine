import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Bell, Loader2, Laptop } from "lucide-react"

type StatusBarProps = {
    notifPermission: NotificationPermission | "unsupported"
    isBusy: boolean
    hasUnsavedChanges: boolean
    requestNotifPermission: () => void
}
export default function StatusBar({ notifPermission, isBusy, hasUnsavedChanges, requestNotifPermission }: StatusBarProps) {
    return (
        <Card className="border-dashed">
            <CardContent className="py-4 flex items-center gap-3 flex-wrap">
                <Badge
                    variant={notifPermission === "granted" ? "default" : notifPermission === "denied" ? "destructive" : "secondary"}
                    className="gap-1"
                >
                    <Bell className="h-3.5 w-3.5" />
                    {notifPermission === "unsupported" && "Notificações não suportadas"}
                    {notifPermission === "default" && "Notificações: permissão pendente"}
                    {notifPermission === "granted" && "Notificações: ativadas"}
                    {notifPermission === "denied" && "Notificações: bloqueadas"}
                </Badge>

                <Separator orientation="vertical" className="h-6 hidden md:block" />

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Laptop className="h-4 w-4" />
                    {isBusy ? "Sincronizando suas preferências..." :
                        hasUnsavedChanges ? "Alterações não salvas" : "Preferências sincronizadas"}
                    {isBusy && <Loader2 className="ml-1 h-4 w-4 animate-spin" />}
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                                <span>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={requestNotifPermission}
                                        disabled={notifPermission === "granted" || notifPermission === "unsupported"}
                                    >
                                        Conceder permissão
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                {notifPermission === "granted"
                                    ? "Permissão já concedida"
                                    : notifPermission === "unsupported"
                                        ? "Seu navegador não suporta notificações"
                                        : "Solicitar permissão ao navegador"}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardContent>
        </Card>
    )
}
