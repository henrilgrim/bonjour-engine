
export class NotificationManager {
  private static notificationQueue: Set<string> = new Set()
  private static permission: NotificationPermission = 'default'

  static {
    // Inicializa a permissão
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission
    }
  }

  static async checkPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }

    this.permission = Notification.permission
    return this.permission
  }

  static async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }

    try {
      this.permission = await Notification.requestPermission()
      return this.permission
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error)
      return 'denied'
    }
  }

  static canShowNotifications(): boolean {
    return this.permission === 'granted' && typeof window !== 'undefined' && 'Notification' in window
  }

  static async showNotification(
    title: string, 
    body: string, 
    options: NotificationOptions & { tag?: string } = {}
  ): Promise<boolean> {
    if (!this.canShowNotifications()) {
      console.log('Notificações não disponíveis ou sem permissão')
      return false
    }

    const notificationId = options.tag || `${title}-${Date.now()}`
    
    // Evita notificações duplicadas
    if (this.notificationQueue.has(notificationId)) {
      console.log('Notificação duplicada ignorada:', notificationId)
      return false
    }

    try {
      this.notificationQueue.add(notificationId)
      
      const notification = new Notification(title, {
        body,
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: notificationId,
        requireInteraction: false,
        silent: true, // O som é controlado pelo sistema de alertas
        ...options
      })

      // Remove da queue quando a notificação é fechada
      notification.onclose = () => {
        this.notificationQueue.delete(notificationId)
      }

      notification.onerror = () => {
        this.notificationQueue.delete(notificationId)
      }

      // Auto-remove depois de um tempo
      setTimeout(() => {
        notification.close()
        this.notificationQueue.delete(notificationId)
      }, 8000)

      console.log('Notificação enviada:', { title, body, notificationId })
      return true
    } catch (error) {
      console.error('Erro ao mostrar notificação:', error)
      this.notificationQueue.delete(notificationId)
      return false
    }
  }

  static clearQueue(): void {
    this.notificationQueue.clear()
  }

  static getQueueSize(): number {
    return this.notificationQueue.size
  }
}
