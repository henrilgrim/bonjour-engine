import { useEffect, useRef } from "react";

interface PwaNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: any;
  playSound?: boolean;
}

export function usePwaNotifications() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPageVisible = useRef(true);

  useEffect(() => {
    // Inicializar áudio
    audioRef.current = new Audio("/notification-sound.wav");
    audioRef.current.volume = 0.7;

    // Verificar visibilidade da página
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Solicitar permissão para notificações
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Listener para ações de notificação PWA
    const handleNotificationClick = (event: any) => {
      event.notification.close();

      // Focar na janela sempre que uma notificação for clicada
      window.focus();

      if (event.action === "approve") {
        // Enviar evento customizado para aprovação
        window.dispatchEvent(
          new CustomEvent("pwa-approve-pause", {
            detail: event.notification.data,
          })
        );
      } else if (event.action === "view") {
        // Navegar para o agente
        if (event.notification.data?.agentLogin) {
          window.dispatchEvent(
            new CustomEvent("pwa-view-agent", {
              detail: event.notification.data,
            })
          );
        }
      }
    };

    // Listener para clique na notificação nativa do navegador
    const handleBrowserNotificationClick = (event: Event) => {
      window.focus();
      const notification = event.target as Notification;
      if (notification.data?.agentLogin) {
        window.dispatchEvent(
          new CustomEvent("pwa-view-agent", {
            detail: notification.data,
          })
        );
      }
      notification.close();
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener(
        "notificationclick",
        handleNotificationClick
      );
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener(
          "notificationclick",
          handleNotificationClick
        );
      }
    };
  }, []);

  const showNotification = async (options: PwaNotificationOptions) => {
    // Tocar som se solicitado
    if (options.playSound && audioRef.current) {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.warn(
          "Não foi possível reproduzir o som de notificação:",
          error
        );
      }
    }

    // Verificar se as notificações estão habilitadas
    if ("Notification" in window && Notification.permission === "granted") {
      // Se a página estiver visível, mostrar apenas notificação in-app
      if (isPageVisible.current) {
        return;
      }

      // Página não está visível - mostrar notificação do navegador
      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || "/favicon.png",
        badge: options.badge || "/favicon.png",
        data: options.data,
        requireInteraction: true,
        tag: "pause-request-" + Date.now(),
      };

      if ("serviceWorker" in navigator) {
        // Usar service worker se disponível (permite actions)
        try {
          const registration = await navigator.serviceWorker.ready;

          const swNotificationOptions = {
            ...notificationOptions,
            actions: options.actions || [],
          };

          registration.showNotification(options.title, swNotificationOptions);
        } catch (error) {
          console.warn(
            "Erro ao mostrar notificação via service worker:",
            error
          );
          // Fallback para notificação simples
          const notification = new Notification(
            options.title,
            notificationOptions
          );
          notification.onclick = () => {
            window.focus();
            if (options.data?.agentLogin) {
              window.dispatchEvent(
                new CustomEvent("pwa-view-agent", {
                  detail: options.data,
                })
              );
            }
            notification.close();
          };
        }
      } else {
        // Fallback para notificação simples sem service worker
        const notification = new Notification(
          options.title,
          notificationOptions
        );
        notification.onclick = () => {
          window.focus();
          if (options.data?.agentLogin) {
            window.dispatchEvent(
              new CustomEvent("pwa-view-agent", {
                detail: options.data,
              })
            );
          }
          notification.close();
        };
      }
    }
  };

  return { showNotification, isPageVisible: () => isPageVisible.current };
}
