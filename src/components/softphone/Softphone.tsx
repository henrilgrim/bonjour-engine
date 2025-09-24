import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Phone,
    PhoneCall,
    Settings2,
    Volume2,
    Minimize2,
    Maximize2,
    Circle,
    PhoneIncoming,
} from "lucide-react";
import { CallItem } from "./CallItem";
import { useSoftphone } from "@/hooks/use-softphone";
import { cn } from "@/lib/utils";

export function Softphone() {
    const {
        config,
        calls,
        activeCallId,
        isRegistered,
        isConnecting,
        volume,
        isMinimized,
        makeCall,
        setVolume,
        setMinimized,
        setConfig,
        simulateIncomingCall,
    } = useSoftphone();

    const [dialNumber, setDialNumber] = useState("");
    const [showSettings, setShowSettings] = useState(false);

    if (!config.enabled) {
        return null;
    }

    const handleMakeCall = () => {
        if (dialNumber.trim()) {
            makeCall(dialNumber.trim());
            setDialNumber("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleMakeCall();
        }
    };

    const activeCalls = calls.filter(
        (call) =>
            call.status === "active" ||
            call.status === "hold" ||
            call.status === "incoming"
    );

    const incomingCalls = calls.filter((call) => call.status === "incoming");

    return (
        <div className="h-full bg-gradient-to-b from-card to-card/80 rounded-2xl border-2 border-border/30 shadow-2xl overflow-hidden">
            {/* Header com visual profissional */}
            <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 border-b border-border/30 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full border border-primary/20">
                            <PhoneCall className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Softphone</h2>
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    isRegistered ? "bg-success animate-pulse" : "bg-destructive"
                                )} />
                                <span className="text-xs font-medium text-muted-foreground">
                                    {isRegistered ? "Conectado" : "Desconectado"}
                                </span>
                                {isConnecting && (
                                    <span className="text-xs text-primary animate-pulse">
                                        Conectando...
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {incomingCalls.length > 0 && (
                            <div className="flex items-center gap-1 bg-destructive/10 text-destructive px-2 py-1 rounded-full border border-destructive/20 animate-pulse">
                                <PhoneIncoming className="h-3 w-3" />
                                <span className="text-xs font-bold">{incomingCalls.length}</span>
                            </div>
                        )}

                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowSettings(!showSettings)}
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                            <Settings2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4 flex-1 flex flex-col overflow-hidden">
                    {/* Settings Panel */}
                    {showSettings && (
                        <div className="bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50 rounded-xl p-4">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Volume2 className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-semibold text-foreground">
                                        Controle de Volume
                                    </span>
                                </div>
                                <Slider
                                    value={[volume * 100]}
                                    onValueChange={([value]) =>
                                        setVolume(value / 100)
                                    }
                                    max={100}
                                    step={1}
                                    className="w-full"
                                />

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        simulateIncomingCall(
                                            "(11) 99999-9999",
                                            "João Silva"
                                        )
                                    }
                                    className="w-full border-primary/20 hover:bg-primary/10"
                                >
                                    <PhoneIncoming className="h-4 w-4 mr-2" />
                                    Simular Chamada
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Dialer */}
                    <div className="bg-gradient-to-r from-card to-card/80 border border-border/30 rounded-xl p-4">
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary" />
                                Discador
                            </h3>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Digite o número..."
                                    value={dialNumber}
                                    onChange={(e) => setDialNumber(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="flex-1 bg-background/50 border-border/50 focus:border-primary/50"
                                />
                                <Button
                                    onClick={handleMakeCall}
                                    disabled={!dialNumber.trim() || !isRegistered}
                                    className="px-4 bg-success hover:bg-success/90 text-success-foreground"
                                >
                                    <Phone className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Active Calls */}
                    <div className="flex-1 flex flex-col min-h-0">
                        {activeCalls.length > 0 ? (
                            <div className="space-y-3 flex-1 flex flex-col">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <PhoneCall className="h-4 w-4 text-primary" />
                                        Chamadas Ativas ({activeCalls.length})
                                    </h3>
                                </div>

                                <ScrollArea className="flex-1">
                                    <div className="space-y-3 pr-2">
                                        {activeCalls.map((call) => (
                                            <CallItem
                                                key={call.id}
                                                call={call}
                                                isActive={call.id === activeCallId}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground bg-gradient-to-b from-muted/20 to-muted/10 rounded-xl border border-border/30">
                                <div className="text-center p-8">
                                    <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-40" />
                                    <p className="text-sm font-medium">Nenhuma chamada ativa</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        As chamadas aparecerão aqui
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Connection Status */}
                    {!isRegistered && (
                        <div className="bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/20 rounded-xl p-4">
                            <div className="flex items-center gap-3 text-destructive">
                                <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                                <div>
                                    <p className="text-sm font-medium">
                                        {isConnecting ? "Conectando ao servidor..." : "Sem conexão"}
                                    </p>
                                    <p className="text-xs text-destructive/80">
                                        Verifique sua conexão SIP
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
}
