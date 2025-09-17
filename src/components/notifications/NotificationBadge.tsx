import { useSystemNotifications } from "@/hooks/use-system-notifications";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

export function NotificationBadge() {
    const { user } = useAuthStore();
    const { unreadCount } = useSystemNotifications({
        accountcode: user?.accountcode || "",
        enabled: !!user?.accountcode,
    });

    if (unreadCount === 0) return null;

    return (
        <div className="relative">
            <Bell className="w-4 h-4" />
            <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
            >
                {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
        </div>
    );
}