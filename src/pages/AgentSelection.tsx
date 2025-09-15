import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRealtimeAgents } from "@/hooks/use-realtime-agents";
import { useSelectedAgentsStore } from "@/store/selectedAgentsStore";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Users,
    User,
    ArrowRight,
    Loader2,
    Search,
    Filter,
    Settings,
    CheckCircle2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AgentSelection() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const { orderedAgents, loading, error } = useRealtimeAgents();
    const {
        selectedAgents,
        toggleAgent,
        setAgents,
        clearSelection,
        isAgentSelected,
    } = useSelectedAgentsStore();

    const [selectAll, setSelectAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Redirect se não autenticado
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
        }
    }, [isAuthenticated, navigate]);

    // Atualizar selectAll baseado na seleção atual
    useEffect(() => {
        if (orderedAgents.length > 0) {
            setSelectAll(selectedAgents.length === orderedAgents.length);
        }
    }, [selectedAgents.length, orderedAgents.length]);

    const handleToggleAll = () => {
        if (selectAll) {
            clearSelection();
        } else {
            const allAgents = orderedAgents.map((agent) => ({
                id: agent.id,
                login: agent.login,
                fullName: agent.fullName,
                displayName: agent.displayName,
            }));
            setAgents(allAgents);
        }
    };

    const handleAgentToggle = (agent: any) => {
        toggleAgent({
            id: agent.id,
            login: agent.login,
            fullName: agent.fullName,
            displayName: agent.displayName,
        });
    };

    const handleContinue = () => {
        if (selectedAgents.length === 0) {
            toast({
                title: "Seleção necessária",
                description: "Selecione pelo menos um agente para monitorar",
                variant: "destructive",
            });
            return;
        }
        navigate("/home");
    };

    const handleSkip = () => {
        const allAgents = orderedAgents.map((agent) => ({
            id: agent.id,
            login: agent.login,
            fullName: agent.fullName,
            displayName: agent.displayName,
        }));
        setAgents(allAgents);
        navigate("/home");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">
                        Carregando agentes...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive">Erro</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            {error}
                        </p>
                        <Button onClick={handleSkip} className="w-full">
                            Continuar assim mesmo
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Filtrar agentes
    const filteredAgents = orderedAgents.filter((agent) => {
        const matchesSearch =
            searchTerm === "" ||
            agent.displayName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            agent.login.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === "all" || agent.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const uniqueStatuses = [
        ...new Set(orderedAgents.map((agent) => agent.status)),
    ];

    return (
        <div className="space-y-6">
            {/* Botões no topo */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleSkip}
                        className="flex items-center gap-2 px-6"
                    >
                        <Users className="w-4 h-4" />
                        Monitorar todos
                    </Button>
                </div>
                <Button
                    onClick={handleContinue}
                    disabled={selectedAgents.length === 0}
                    className="flex items-center gap-2 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
                >
                    Continuar ({selectedAgents.length})
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Controles e filtros */}
            <Card className="backdrop-blur-sm bg-card/95 shadow-lg border-border/50">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    Agentes Online ({filteredAgents.length})
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {selectedAgents.length} de{" "}
                                    {orderedAgents.length} selecionados
                                </p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="px-3 py-1">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {selectedAgents.length} selecionados
                        </Badge>
                    </div>

                    {/* Filtros e busca */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar agentes por nome ou login..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                                className="px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="all">Todos os status</option>
                                {uniqueStatuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3">
                        <Checkbox
                            id="select-all"
                            checked={selectAll}
                            onCheckedChange={handleToggleAll}
                        />
                        <label
                            htmlFor="select-all"
                            className="text-sm font-medium leading-none cursor-pointer"
                        >
                            Selecionar todos ({filteredAgents.length} agentes)
                        </label>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredAgents.length === 0 ? (
                        <div className="text-center py-12">
                            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground text-lg mb-2">
                                {searchTerm || statusFilter !== "all"
                                    ? "Nenhum agente encontrado"
                                    : "Nenhum agente online no momento"}
                            </p>
                            {searchTerm && (
                                <p className="text-sm text-muted-foreground">
                                    Tente ajustar os filtros de busca
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[70vh] overflow-auto nice-scroll pr-2">
                            {filteredAgents.map((agent) => (
                                <div
                                    key={agent.id}
                                    className={`group relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer w-full
                    ${
                        isAgentSelected(agent.id)
                            ? "bg-primary/5 border-primary/30 shadow-md ring-1 ring-primary/20"
                            : "bg-card hover:bg-accent/30 hover:border-accent-foreground/20 hover:shadow-sm"
                    }`}
                                    onClick={() => handleAgentToggle(agent)}
                                >
                                    {/* Topo com avatar + nome */}
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={isAgentSelected(agent.id)}
                                            onChange={() => {}}
                                        />
                                        <Avatar className="w-12 h-12 ring-2 ring-background group-hover:ring-accent-foreground/20 transition-all">
                                            <AvatarFallback
                                                className="text-sm font-bold"
                                                style={{
                                                    backgroundColor: `${agent.color}15`,
                                                    color: agent.color,
                                                }}
                                            >
                                                {agent.initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate">
                                                {agent.displayName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Login: {agent.login}
                                            </p>
                                        </div>
                                        {isAgentSelected(agent.id) && (
                                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                        )}
                                    </div>

                                    {/* Informações extras */}
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        <Badge
                                            variant="outline"
                                            style={{
                                                borderColor: agent.color,
                                                color: agent.color,
                                                backgroundColor: `${agent.color}10`,
                                            }}
                                        >
                                            {agent.status}
                                        </Badge>
                                        <span>Ramal: {agent.ramal}</span>
                                        <span>Duração: {agent.duration}</span>
                                    </div>

                                    {agent.queues &&
                                        agent.queues.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {agent.queues
                                                    .slice(0, 2)
                                                    .map((queue, idx) => (
                                                        <Badge
                                                            key={idx}
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {queue.queueName}
                                                        </Badge>
                                                    ))}
                                                {agent.queues.length > 2 && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        +
                                                        {agent.queues.length -
                                                            2}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
