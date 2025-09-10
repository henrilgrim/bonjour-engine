export const THEME_COLORS = {
	light: {
		primary: "262 83% 58%", // Roxo vibrante
		secondary: "210 40% 96%", // Cinza claro
		accent: "210 40% 96%", // Cinza claro
		background: "0 0% 100%", // Branco
		foreground: "222.2 84% 4.9%", // Preto suave
		muted: "210 40% 96%", // Cinza claro
		border: "214.3 31.8% 91.4%", // Cinza borda
	},
	dark: {
		primary: "262 83% 58%", // Roxo vibrante (mesmo)
		secondary: "217.2 32.6% 17.5%", // Cinza escuro
		accent: "217.2 32.6% 17.5%", // Cinza escuro
		background: "222.2 84% 4.9%", // Preto suave
		foreground: "210 40% 98%", // Branco suave
		muted: "217.2 32.6% 17.5%", // Cinza escuro
		border: "217.2 32.6% 17.5%", // Cinza borda escuro
	},
} as const

// Função para gerar CSS customizado
export function generateThemeCSS(colors: typeof THEME_COLORS.light) {
	return `
    --primary: ${colors.primary};
    --secondary: ${colors.secondary};
    --accent: ${colors.accent};
    --background: ${colors.background};
    --foreground: ${colors.foreground};
    --muted: ${colors.muted};
    --border: ${colors.border};
  `
}
