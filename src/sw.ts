/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching"

declare const self: ServiceWorkerGlobalScope & {
    __WB_MANIFEST?: any;
};

const isDevMode = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
if (!isDevMode) {
    cleanupOutdatedCaches()
    precacheAndRoute(self.__WB_MANIFEST || [])
}

self.addEventListener("install", (event) => {
    self.skipWaiting()
})

self.addEventListener("activate", (event) => {
    self.clients.claim()
})

// Recebe mensagens do app
self.addEventListener("message", (event) => {
    const { id, title, body, icon } = event.data || {}

    if (!title || !body || !id) return

    self.registration.showNotification(title, {
        body,
        icon: icon || "/icon.png",
        tag: id,
    })
})

// Notificação clicada
self.addEventListener("notificationclick", (event) => {
    event.notification.close()

    event.waitUntil(
        (async () => {
            const allClients = await self.clients.matchAll({
                type: "window",
                includeUncontrolled: true,
            })

            for (const client of allClients) {
                if ("focus" in client) {
                    client.focus()
                    client.postMessage({ type: "notification-click" })
                    return
                }
            }

            // Abre nova aba se não houver clientes
            self.clients.openWindow("/")
        })()
    )
})
