import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useNotificationsConfig } from "@/hooks/use-notifications-config";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { playAlert, type AlertType } from "@/lib/sfx/alerts";
import {
    Bell,
    Check,
    Loader2,
    AlertTriangle,
    Volume2,
    Save,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { SettingRow } from "./SettingRow";
import { LocalNotificationsConfig } from "./types";

type CardNotificationProps = {
    localConfig: LocalNotificationsConfig;
    isBusy: boolean;
    hasUnsavedChanges: boolean;
    handleLocalConfigChange: (
        key: keyof LocalNotificationsConfig,
        value: boolean | string | number
    ) => void;
    handleSaveSettings: () => void;
};

export default function CardNotification({
    localConfig,
    isBusy,
    hasUnsavedChanges,
    handleLocalConfigChange,
    handleSaveSettings,
}: CardNotificationProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notificações
                </CardTitle>
                <CardDescription>
                    Defina quando deseja ser avisado.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <SettingRow
                    id="message-notifications"
                    title="Mensagens"
                    description="Receba avisos quando novas mensagens chegarem."
                    checked={localConfig.messageNotifications}
                    disabled={isBusy}
                    onCheckedChange={(enabled) =>
                        handleLocalConfigChange("messageNotifications", enabled)
                    }
                />

                <Separator />

                <SettingRow
                    id="pause-notifications"
                    title="Pausas"
                    description="Seja alertado sobre solicitações e limites de pausa."
                    checked={localConfig.pauseNotifications}
                    disabled={isBusy}
                    onCheckedChange={(enabled) =>
                        handleLocalConfigChange("pauseNotifications", enabled)
                    }
                />

                <Separator />

                <SettingRow
                    id="system-notifications"
                    title="Sistema"
                    description="Atualizações, alertas e eventos do aplicativo."
                    checked={localConfig.systemNotifications}
                    disabled={isBusy}
                    onCheckedChange={(enabled) =>
                        handleLocalConfigChange("systemNotifications", enabled)
                    }
                />

                <Separator />

                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium leading-none">
                            Som das notificações
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Todas as notificações usam o som padrão do sistema.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value="notification" disabled={true}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Som de notificação" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="notification">
                                    Som de notificação
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <TooltipProvider>
                            <Tooltip delayDuration={200}>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            playAlert("soft", {
                                                volume:
                                                    localConfig.volume / 100,
                                            })
                                        }
                                        disabled={isBusy}
                                    >
                                        <Volume2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                    Testar som
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <Separator />

                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium leading-none">
                            Volume das notificações
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Controle o volume dos sons de notificação.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 min-w-32">
                        <Slider
                            value={[localConfig.volume]}
                            onValueChange={([value]) =>
                                handleLocalConfigChange("volume", value)
                            }
                            max={100}
                            min={0}
                            step={5}
                            disabled={isBusy}
                            className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground min-w-8 text-right">
                            {localConfig.volume}%
                        </span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="justify-between">
                <div className="text-xs text-muted-foreground">
                    {isBusy ? (
                        <span className="inline-flex items-center gap-1">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                            Salvando alterações…
                        </span>
                    ) : hasUnsavedChanges ? (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="h-3.5 w-3.5" /> Alterações
                            não salvas
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Tudo salvo
                        </span>
                    )}
                </div>

                <Button
                    size="sm"
                    onClick={handleSaveSettings}
                    disabled={!hasUnsavedChanges || isBusy}
                    className="gap-2"
                >
                    {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    Salvar configurações
                </Button>
            </CardFooter>
        </Card>
    );
}
