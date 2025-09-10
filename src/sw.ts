/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching"

declare const self: ServiceWorkerGlobalScope & {
	__WB_MANIFEST?: any;
};

// Marcador necessário para o Workbox injetar o manifesto
const isDevMode = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
if (!isDevMode) {
	cleanupOutdatedCaches()
	precacheAndRoute(self.__WB_MANIFEST || [])
}
// tipo local com `actions`
interface SWNotificationOptions extends NotificationOptions {
	actions?: Array<{ action: string; title: string; icon?: string }>;
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("notificationclick", (event: NotificationEvent) => {
	event.notification.close();

	const tag = event.notification?.tag as string | undefined;
	const action = event.action as string | undefined;

	event.waitUntil((async () => {
		const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
		const targetUrl =
			tag === "message" ? "/chat" :
				tag === "break-exceeded" ? "/pauses" : "/";

		// foca uma aba existente, senão abre
		const client = clientsList.find(c => (c as WindowClient).url.includes(self.registration.scope)) as WindowClient | undefined;
		if (client) {
			await client.focus();
			client.postMessage({ type: "NOTIFICATION_CLICK", tag, action });
		} else {
			await self.clients.openWindow(targetUrl);
		}
	})());
});

self.addEventListener("push", (event: PushEvent) => {
	let payload: any = {};
	try { payload = event.data?.json() ?? {}; } catch { payload = { title: "Notificação", body: event.data?.text() ?? "" }; }

	const title = payload.title ?? "Notificação";
	const options: SWNotificationOptions = {
		body: payload.body ?? "",
		tag: payload.tag ?? "default",
		data: payload.data ?? {},
		actions: payload.actions ?? [{ action: "view", title: "Abrir" }], // <- agora tipado
	};

	event.waitUntil(self.registration.showNotification(title, options));
});
