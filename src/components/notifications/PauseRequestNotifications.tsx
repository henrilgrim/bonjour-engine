
import { PauseCircle, Clock, Check, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePauseNotifications } from '@/hooks/use-pause-notifications';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/hooks/use-toast';
import { respondPauseRequest } from '@/lib/firebase/realtime/pause/request';
import { Timestamp } from 'firebase/firestore';
import { useEffect } from 'react';

interface PauseRequestNotificationsProps {
	onOpenAgentDialog?: (agentLogin: string, initialTab?: "overview" | "chat" | "pause-requests") => void;
}

export const formatTime = (t: number | Timestamp | null | undefined) => {
	if (!t) return "--:--";

	let date: Date | null = null;

	if (typeof t === "number") {
		// Se já for um number (ms)
		date = new Date(t);
	} else if (t instanceof Date) {
		date = t;
	} else if (typeof t === "object" && "seconds" in t) {
		// Firestore Timestamp
		date = new Date(t.seconds * 1000);
	}

	if (!date || isNaN(date.getTime())) return "--:--";

	return date.toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
	});
};


export function PauseRequestNotifications({ onOpenAgentDialog }: PauseRequestNotificationsProps = {}) {
	const auth = useAuthStore();
	const { notifications, count } = usePauseNotifications({ 
		accountcode: auth.company?.accountcode || '', 
		enabled: !!auth.company?.accountcode && auth.isAuthenticated 
	});

	// Listener para ações de notificação PWA
	useEffect(() => {
		const handlePwaApprove = async (event: any) => {
			const { agentLogin, accountcode } = event.detail;
			try {
				await respondPauseRequest(
					accountcode, 
					agentLogin, 
					{ status: 'approved' },
					auth.user?.nome || 'Desconhecido',
					auth.user?.id || auth.user?.login || 'unknown'
				);
				toast({
					title: 'Pausa Aprovada',
					description: `Solicitação de ${agentLogin} aprovada via notificação`,
				});
			} catch (error) {
				console.error('Erro ao aprovar via PWA:', error);
				toast({
					title: 'Erro',
					description: 'Não foi possível aprovar a pausa',
					variant: 'destructive',
				});
			}
		};

		const handlePwaViewAgent = (event: any) => {
			if (onOpenAgentDialog && event.detail?.agentLogin) {
				onOpenAgentDialog(event.detail.agentLogin, 'pause-requests');
			}
		};

		window.addEventListener('pwa-approve-pause', handlePwaApprove);
		window.addEventListener('pwa-view-agent', handlePwaViewAgent);

		return () => {
			window.removeEventListener('pwa-approve-pause', handlePwaApprove);
			window.removeEventListener('pwa-view-agent', handlePwaViewAgent);
		};
	}, [onOpenAgentDialog, auth.company?.accountcode]);

	if (count === 0) return null;

	const handleApprove = async (notification: any) => {
		try {
			await respondPauseRequest(
				auth.company?.accountcode || '', 
				notification.agentLogin, 
				{ status: 'approved' },
				auth.user?.nome || 'Desconhecido',
				auth.user?.id || auth.user?.login || 'unknown'
			);
		} catch (error) {
			console.error('Erro ao aprovar pausa:', error);
			toast({ title: 'Erro', description: 'Não foi possível aprovar a pausa', variant: 'destructive' });
		}
	};

	return (
		<div className="fixed top-4 right-4 z-50 max-h-screen overflow-y-auto">
			<div className="space-y-2">
				{notifications.slice(0, 3).map((notification) => (
					<div key={`${notification.agentLogin}-${notification.createdAt}`} className="bg-background border rounded-lg shadow-lg p-4 mb-3 animate-in slide-in-from-right-full duration-300 max-w-sm">
						<div className="flex items-start gap-3">
							<div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
								<PauseCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<h4 className="text-sm font-medium text-foreground truncate">
										{notification.agentLogin}
									</h4>
									<Badge variant="secondary" className="text-xs">
										<Clock className="w-3 h-3 mr-1" />
										Pendente
									</Badge>
								</div>

								<p className="text-sm text-muted-foreground line-clamp-2 mb-2">
									Solicitou pausa: {notification.reasonName}
								</p>

								{notification.createdAt && (
									<p className="text-xs text-muted-foreground mb-3">
										{formatTime(notification.createdAt)}
									</p>
								)}

								<div className="flex gap-2">
									{onOpenAgentDialog && (
										<Button
											size="sm"
											variant="outline"
											onClick={() => onOpenAgentDialog(notification.agentLogin, 'pause-requests')}
											className="h-7 text-xs"
										>
											<User className="w-3 h-3 mr-1" />
											Ver Agente
										</Button>
									)}
									<Button
										size="sm"
										onClick={() => handleApprove(notification)}
										className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
									>
										<Check className="w-3 h-3 mr-1" />
										Aprovar
									</Button>
								</div>
							</div>
						</div>
					</div>
				))}

				{count > 3 && (
					<div className="text-center">
						<Badge variant="outline" className="text-xs">
							+{count - 3} mais solicitações
						</Badge>
					</div>
				)}
			</div>
		</div>
	);
}
