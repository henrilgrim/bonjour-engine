import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Users, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AgentInfoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: "queues" | "pause";
}

export function AgentInfoModal({ open, onOpenChange, type }: AgentInfoModalProps) {
    const isQueues = type === "queues";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isQueues ? (
                            <>
                                <Users className="h-5 w-5 text-primary" />
                                Filas de Atendimento
                            </>
                        ) : (
                            <>
                                <Clock className="h-5 w-5 text-warning" />
                                Status da Equipe
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isQueues 
                            ? "Informações sobre as filas de atendimento ativas"
                            : "Status atual dos agentes da equipe"
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {isQueues ? (
                        <>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center justify-between">
                                        Fila Geral
                                        <Badge variant="secondary" className="text-xs">
                                            Ativa
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Aguardando</p>
                                            <p className="font-semibold text-primary">12</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Atendendo</p>
                                            <p className="font-semibold text-success">8</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center justify-between">
                                        Fila Suporte
                                        <Badge variant="secondary" className="text-xs">
                                            Ativa
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Aguardando</p>
                                            <p className="font-semibold text-primary">4</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Atendendo</p>
                                            <p className="font-semibold text-success">3</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-success"></div>
                                        Agentes Disponíveis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-bold text-success">15</div>
                                    <p className="text-xs text-muted-foreground">Prontos para atendimento</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-warning"></div>
                                        Agentes em Pausa
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-bold text-warning">3</div>
                                    <p className="text-xs text-muted-foreground">Temporariamente indisponíveis</p>
                                    <div className="mt-3 space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">João Silva</span>
                                            <span className="text-warning">Almoço</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Maria Santos</span>
                                            <span className="text-warning">Banheiro</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Pedro Costa</span>
                                            <span className="text-warning">Reunião</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                                        Agentes Ocupados
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-bold text-primary">8</div>
                                    <p className="text-xs text-muted-foreground">Em atendimento ativo</p>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}