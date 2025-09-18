import { useEffect, useState } from "react";
import {
    useFirebaseSupervisors,
    SupervisorOnline,
} from "@/hooks/use-firebase-supervisors";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { SupervisorSelector } from "./SupervisorSelector";
import { SupervisorChatView } from "./SupervisorChatView";
import { ChatHeader } from "./ChatHeader";
import { ChatDialog } from "./ChatDialog";

type Props = {
    open: boolean;
    onClose: () => void;
    onBack: () => void;
    isPaused: boolean;
    initialSupervisorId?: string | null;
};

export function SupervisorFloatingChat({
    open,
    onClose,
    onBack,
    isPaused,
    initialSupervisorId,
}: Props) {
    const user = useAuthStore((s) => s.user);
    const company = useAppStore((s) => s.company);
    const { supervisors } = useFirebaseSupervisors();

    const [selectedSupervisor, setSelectedSupervisor] =
        useState<SupervisorOnline | null>(null);
    const [showSelector, setShowSelector] = useState(true);

    const isAvailable = !!(
        selectedSupervisor?.id &&
        user &&
        company?.accountcode
    );

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setSelectedSupervisor(null);
            setShowSelector(true);
        } else if (initialSupervisorId && supervisors.length > 0) {
            // Se há um supervisor específico solicitado, seleciona-o diretamente
            const targetSupervisor = supervisors.find(
                (s) => s.id === initialSupervisorId
            );
            if (targetSupervisor) {
                setSelectedSupervisor(targetSupervisor);
                setShowSelector(false);
            }
        }
    }, [open, initialSupervisorId, supervisors]);

    const handleSelectSupervisor = (supervisor: SupervisorOnline) => {
        setSelectedSupervisor(supervisor);
        setShowSelector(false);
    };

    const handleBackToSelector = () => {
        setShowSelector(true);
        setSelectedSupervisor(null);

        onBack();
    };

    return (
        <ChatDialog open={open} onClose={onClose} isPaused={isPaused}>
            <ChatHeader
                showSelector={showSelector}
                selectedSupervisor={selectedSupervisor}
                isAvailable={isAvailable}
                onBack={handleBackToSelector}
                onClose={onClose}
            />

            {showSelector ? (
                <div className="flex-1 min-h-0 overflow-y-auto nice-scroll px-3 py-3">
                    <SupervisorSelector
                        onSelectSupervisor={handleSelectSupervisor}
                    />
                </div>
            ) : selectedSupervisor ? (
                <SupervisorChatView supervisor={selectedSupervisor} />
            ) : null}
        </ChatDialog>
    );
}
