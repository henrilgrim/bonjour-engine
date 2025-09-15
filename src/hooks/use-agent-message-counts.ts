// use-agent-message-counts.ts
import { useEffect, useMemo, useState } from "react"
import { useAuthStore } from "@/store/authStore"
import { subscribeAllAccountMessages /* ou use a versão ByChat se preferir */ } from "@/lib/firebase/firestore/chats"
import type { ChatMessage } from "@/types/px-direct-chat"

export interface AgentMessageCounts {
	[agentLogin: string]: number
}

// Extrai agentLogin de um chatId no formato: ag_{agentLogin}__sup_{supervisorId}
function extractAgentLogin(chatId: string): string | null {
	if (!chatId.startsWith("ag_")) return null
	const SEP = "__sup_"
	const idx = chatId.indexOf(SEP)
	if (idx === -1) return null
	return chatId.substring(3, idx) // entre "ag_" e "__sup_"
}

export function useAgentMessageCounts() {
	const [messageCounts, setMessageCounts] = useState<AgentMessageCounts>({})
	const [loading, setLoading] = useState(true)

	const company = useAuthStore((s) => s.company)
	const user = useAuthStore((s) => s.user)
	const supervisorId = (user as any)?.id || (user as any)?.login

	useEffect(() => {
		if (!company?.accountcode || !supervisorId) {
			setLoading(false)
			return
		}

		const unsubscribe = subscribeAllAccountMessages(
			company.accountcode,
			(grouped: Record<string, ChatMessage[]>) => {
				const counts: AgentMessageCounts = {}

				for (const [chatId, messages] of Object.entries(grouped)) {
					const agentLogin = extractAgentLogin(chatId)
					if (!agentLogin) continue

					// Conta mensagens NÃO lidas destinadas ao supervisor
					const unreadCount = messages.filter(
						(m) => !m.read && String(m.receiverId) === String(supervisorId)
					).length

					if (unreadCount > 0) counts[agentLogin] = unreadCount
				}

				setMessageCounts(counts)
				setLoading(false)
			},
			(error) => {
				console.error("Erro ao escutar mensagens:", error)
				setLoading(false)
			}
		)

		return unsubscribe
	}, [company?.accountcode, supervisorId])

	const totalUnread = useMemo(
		() => Object.values(messageCounts).reduce((sum, n) => sum + n, 0),
		[messageCounts]
	)

	const clearAgentCount = (agentLogin: string) => {
		setMessageCounts((prev) => {
			const next = { ...prev }
			delete next[agentLogin]
			return next
		})
	}

	return { messageCounts, loading, clearAgentCount, totalUnread }
}
