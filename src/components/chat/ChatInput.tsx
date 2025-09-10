import { useState, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
	onSendMessage: (message: string) => void
	disabled?: boolean
	placeholder?: string
}

export function ChatInput({ onSendMessage, disabled = false, placeholder = "Digite sua mensagem..." }: ChatInputProps) {
	const [message, setMessage] = useState('')

	const handleSend = () => {
		if (message.trim() && !disabled) {
			onSendMessage(message.trim())
			setMessage('')
		}
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	return (
		<div className="flex gap-4 p-4 border-t bg-background">
			<Input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} disabled={disabled} className="flex-1" />
			<Button onClick={handleSend} disabled={disabled || !message.trim()} size="sm" className="rounded-full h-9 w-9 lg:h-10 lg:w-10 p-0 shrink-0" >
				{disabled ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<Send className="h-4 w-4" />)}
			</Button>
		</div>
	)
}