import { NotificationsList } from "@/components/notifications/NotificationsList";
import { useAuthStore } from "@/store/authStore";

export default function Notifications() {
    const { user } = useAuthStore();

    return (
        <div className="space-y-8">
            <NotificationsList
                accountcode={user.accountcode}
                agentOnly={false}
            />
        </div>
    );
}
