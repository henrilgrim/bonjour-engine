import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [showPrompt, setShowPrompt] = useState(false);

	useEffect(() => {
		const dismissed = localStorage.getItem('pwa-install-dismissed');
		if (dismissed) return;

		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			setShowPrompt(true);
		};

		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
		};
	}, []);

	const handleInstall = async () => {
		if (!deferredPrompt) return;

		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === 'accepted') {
			
		}

		setDeferredPrompt(null);
		setShowPrompt(false);
	};

	const handleDismiss = () => {
		localStorage.setItem('pwa-install-dismissed', 'true');
		setShowPrompt(false);
	};

	if (!showPrompt || !deferredPrompt) return null;

	return (
		<Card className="mb-4 border-primary/20 bg-primary/5">
			<CardContent className="p-4">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<Download className="h-5 w-5 text-primary" />
						<div>
							<p className="text-sm font-medium">Instalar aplicativo</p>
							<p className="text-xs text-muted-foreground">
								Tenha acesso rápido sem precisar do navegador
							</p>
						</div>
					</div>
					<div className="flex gap-2">
						<Button size="sm" onClick={handleInstall}>
							Instalar
						</Button>
						<Button size="sm" variant="ghost" onClick={handleDismiss}>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}