import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/hooks/use-toast'

interface ChatNotificationOptions {
	enabled?: boolean
	soundEnabled?: boolean
}

type Msg = {
	id?: string
	senderId?: string
	senderName?: string
	content?: string
}

export function useChatNotifications(messages: Msg[], options: ChatNotificationOptions = {}) {
	const { enabled = true, soundEnabled = true } = options
	const user = useAuthStore((s) => s.user)

	const isInitialLoad = useRef(true)
	const lastSeenId = useRef<string | undefined>(undefined)

	useEffect(() => {
		if (!enabled || !user || !Array.isArray(messages)) return

		const myIds = new Set<string>(
			[user.id, user.login].filter((v): v is string => typeof v === 'string' && v.length > 0)
		)

		const lastMsg = messages[messages.length - 1]
		const lastId = lastMsg?.id

		if (isInitialLoad.current) {
			isInitialLoad.current = false
			lastSeenId.current = lastId
			return
		}

		if (!messages.length) return
		if (lastSeenId.current === lastId) return

		let startIdx = -1
		if (lastSeenId.current) {
			startIdx = messages.findIndex((m) => m.id === lastSeenId.current)
		}
		const newMessages = startIdx >= 0 ? messages.slice(startIdx + 1) : [lastMsg].filter(Boolean) as Msg[]

		const otherUsersMessages = newMessages.filter((m) => m.senderId && !myIds.has(String(m.senderId)))

		if (otherUsersMessages.length > 0) {
			const m = otherUsersMessages[otherUsersMessages.length - 1]
			const text = (m.content ?? '').toString()
			toast({
				title: 'Nova mensagem',
				description: `${m.senderName ?? 'Novo'}: ${text.slice(0, 50)}${text.length > 50 ? '...' : ''}`,
				duration: 3000,
			})

			if ('Notification' in window) {
				if (Notification.permission === 'default') Notification.requestPermission()
				if (Notification.permission === 'granted') {
					new Notification('Nova mensagem no chat', {
						body: `${m.senderName ?? 'Novo'}: ${text}`,
						icon: '/favicon.png',
						badge: '/favicon.png',
					})
				}
			}

			if (soundEnabled) {
				try {
					const audio = new Audio('/sounds/notify.mp3')
					audio.play().catch(() => { })
				} catch { }
			}
		}

		lastSeenId.current = lastId
	}, [messages, enabled, soundEnabled, user])
}
