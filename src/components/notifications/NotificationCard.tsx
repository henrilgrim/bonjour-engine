import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, EyeOff, User, Clock } from "lucide-react";
import type { Notification } from "@/lib/firebase/firestore/notifications";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface NotificationCardProps {
    notification: Notification;
    currentUserLogin?: string;
    onMarkAsRead?: () => void;
    showReadStatus?: boolean;
}

export function NotificationCard({
    notification,
    currentUserLogin,
    onMarkAsRead,
    showReadStatus = true,
}: NotificationCardProps) {
    const [showDetails, setShowDetails] = useState(false);
    
    const isRead = currentUserLogin ? notification.readBy?.[currentUserLogin] : false;
    const readCount = notification.readBy ? Object.keys(notification.readBy).length : 0;
    const totalAgents = notification.targetAgents.length;
    const unreadCount = totalAgents - readCount;

    const formatDate = (timestamp: number) => {
        return format(new Date(timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Card className={`${!isRead && currentUserLogin ? 'border-primary' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{notification.title}</h3>
                            {!isRead && currentUserLogin && (
                                <Badge variant="default" className="text-xs">
                                    Nova
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {notification.createdByName}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(notification.createdAt)}
                            </div>
                        </div>
                    </div>
                    
                    {!isRead && currentUserLogin && onMarkAsRead && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onMarkAsRead}
                        >
                            <Eye className="w-4 h-4 mr-1" />
                            Marcar como lida
                        </Button>
                    )}
                </div>
            </CardHeader>

            {showReadStatus && (
                <CardContent className="pt-0">
                    <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full justify-between">
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    <span>
                                        {readCount} de {totalAgents} agentes visualizaram
                                    </span>
                                </div>
                                {showDetails ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </Button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="mt-3">
                            <div className="space-y-3">
                                {/* Visualizaram */}
                                {readCount > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-green-600 mb-2">
                                            Visualizaram ({readCount})
                                        </h4>
                                        <div className="space-y-2">
                                            {Object.values(notification.readBy || {}).map((readStatus) => (
                                                <div key={readStatus.agentLogin} className="flex items-center gap-2">
                                                    <Avatar className="w-6 h-6">
                                                        <AvatarFallback className="text-xs bg-green-100 text-green-600">
                                                            {getInitials(readStatus.agentName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm">{readStatus.agentName}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(readStatus.readAt)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Não visualizaram */}
                                {unreadCount > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                            Pendente ({unreadCount})
                                        </h4>
                                        <div className="space-y-2">
                                            {notification.targetAgents
                                                .filter(login => !notification.readBy?.[login])
                                                .map((login) => (
                                                    <div key={login} className="flex items-center gap-2">
                                                        <Avatar className="w-6 h-6">
                                                            <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                                                                {getInitials(login)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm text-muted-foreground">{login}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </CardContent>
            )}
        </Card>
    );
}