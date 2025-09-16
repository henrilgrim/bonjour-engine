import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
	return new Intl.NumberFormat("pt-BR").format(num)
}

export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("pt-BR", {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date)
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout
	return (...args: Parameters<T>) => {
		clearTimeout(timeout)
		timeout = setTimeout(() => func(...args), wait)
	}
}
