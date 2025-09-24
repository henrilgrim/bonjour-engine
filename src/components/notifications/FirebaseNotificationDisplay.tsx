import React from "react";
import { Bell, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFirebaseNotifications } from "@/hooks/use-firebase-notifications";
import { cn } from "@/lib/utils";

export function FirebaseNotificationDisplay() {
    const { notifications, markAsRead, hasNotifications } =
        useFirebaseNotifications();

    if (!hasNotifications) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] space-y-2">
            {notifications.map((notification) => (
                <Card
                    key={notification.id}
                    className={cn(
                        "relative shadow-lg border animate-in slide-in-from-right-full",
                        "bg-background border-border"
                    )}
                >
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm font-medium">
                                    {notification.title}
                                </CardTitle>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 w-6 p-0 hover:bg-destructive/10"
                                aria-label="Fechar notificação"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-3">
                            {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">
                                    De: {notification.createdByName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(
                                        notification.createdAt
                                    ).toLocaleString()}
                                </span>
                            </div>

                            <Button
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-8"
                            >
                                <Check className="h-3 w-3 mr-1" />
                                Confirmar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function FirebaseNotificationBadge() {
    const { notificationCount, hasNotifications } = useFirebaseNotifications();

    if (!hasNotifications) {
        return null;
    }

    return (
        <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
            {notificationCount > 9 ? "9+" : notificationCount}
        </Badge>
    );
}
