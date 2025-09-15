import { useState } from "react";
import { useSelectedAgentsStore } from "@/store/selectedAgentsStore";
import { useRealtimeAgents } from "@/hooks/use-realtime-agents";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Trash2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function SettingsPage() {
    const { user } = useAuthStore();
    const { orderedAgents } = useRealtimeAgents();
    const {
        selectedAgents,
        clearSelection,
        removeAgent,
        hasSelection,
        toggleAgent,
    } = useSelectedAgentsStore();

    // Settings state
    const [notifications, setNotifications] = useState(true);
    const [sounds, setSounds] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    // Modal state
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

    const handleRemoveAgent = (agentId: string) => {
        removeAgent(agentId);
        toast({
            title: "Agente removido",
            description: "O agente foi removido da lista de monitoramento",
        });
    };

    const handleClearAll = () => {
        clearSelection();
        toast({
            title: "Lista limpa",
            description:
                "Todos os agentes foram removidos da lista de monitoramento",
        });
    };

    const handleAddAgents = () => {
        setIsAgentModalOpen(true);
    };

    return (
        <div>
            <Tabs defaultValue="agents" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger
                        value="agents"
                        className="flex items-center gap-2"
                    >
                        <Users className="w-4 h-4" />
                        Agentes
                    </TabsTrigger>
                </TabsList>

                {/* Agentes Tab */}
                <TabsContent value="agents" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        Agentes Selecionados
                                    </CardTitle>
                                    <CardDescription>
                                        Gerencie os agentes que você está
                                        monitorando atualmente
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                        {selectedAgents.length} selecionados
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddAgents}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Adicionar
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!hasSelection || selectedAgents.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                    <p className="text-muted-foreground mb-4">
                                        Nenhum agente selecionado para
                                        monitoramento
                                    </p>
                                    <Button
                                        onClick={handleAddAgents}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Selecionar Agentes
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-muted-foreground">
                                            {selectedAgents.length} agente
                                            {selectedAgents.length !== 1
                                                ? "s"
                                                : ""}{" "}
                                            sendo monitorado
                                            {selectedAgents.length !== 1
                                                ? "s"
                                                : ""}
                                        </p>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleClearAll}
                                            className="flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Limpar tudo
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-auto nice-scroll">
                                        {selectedAgents.map((agent) => {
                                            const currentAgent =
                                                orderedAgents.find(
                                                    (a) => a.id === agent.id
                                                );
                                            return (
                                                <div
                                                    key={agent.id}
                                                    className="relative flex flex-col gap-3 p-4 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow"
                                                >
                                                    {/* Avatar + Nome */}
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-10 h-10">
                                                            <AvatarFallback className="text-xs font-semibold">
                                                                {agent.displayName
                                                                    .split(" ")
                                                                    .map(
                                                                        (n) =>
                                                                            n[0]
                                                                    )
                                                                    .join("")
                                                                    .slice(
                                                                        0,
                                                                        2
                                                                    )}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <p className="font-medium truncate">
                                                                {
                                                                    agent.displayName
                                                                }
                                                            </p>
                                                            <p className="text-sm text-muted-foreground truncate">
                                                                Login:{" "}
                                                                {agent.login}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Status */}
                                                    {currentAgent && (
                                                        <Badge
                                                            variant="outline"
                                                            className="w-fit text-xs"
                                                            style={{
                                                                borderColor:
                                                                    currentAgent.color,
                                                                color: currentAgent.color,
                                                            }}
                                                        >
                                                            {
                                                                currentAgent.status
                                                            }
                                                        </Badge>
                                                    )}

                                                    {/* Botão remover */}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleRemoveAgent(
                                                                agent.id
                                                            )
                                                        }
                                                        className="absolute top-2 right-2 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal de seleção de agentes */}
            <Dialog open={isAgentModalOpen} onOpenChange={setIsAgentModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Selecionar Agentes</DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="h-96 pr-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {orderedAgents.map((agent) => {
                                const alreadySelected = selectedAgents.some(
                                    (a) => a.id === agent.id
                                );
                                return (
                                    <div
                                        key={agent.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted
                                            ${
                                                alreadySelected
                                                    ? "bg-muted/50"
                                                    : ""
                                            }`}
                                        onClick={() => toggleAgent(agent)}
                                    >
                                        <Avatar className="w-9 h-9">
                                            <AvatarFallback>
                                                {agent.displayName
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-medium truncate">
                                                {agent.displayName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Login: {agent.login}
                                            </p>
                                        </div>
                                        <Checkbox checked={alreadySelected} />
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAgentModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={() => setIsAgentModalOpen(false)}>
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
