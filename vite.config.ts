import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";

export default defineConfig(({ mode }) => ({
	server: {
		host: "::",
		port: 9595,
		allowedHosts: ["gestor.pxtalk.com.br", "localhost"],
	},
	plugins: [
		react(),
		VitePWA({
			strategies: "injectManifest",
			srcDir: "src",
			filename: "sw.ts",

			injectRegister: "auto",
			registerType: "autoUpdate",
			devOptions: {
				enabled: false,
				type: 'classic',
			},

			includeAssets: ["favicon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png"],

			manifest: {
				name: "Painel para Gestão de Operadores PxTalk",
				short_name: "PxTalk Manager",
				description: "Sistema de gestão para operadores PxTalk",
				start_url: "/",
				scope: "/",
				display: "standalone",
				background_color: "#ffffff",
				theme_color: "#1f2937",
				icons: [
					{
						src: "favicon.png",
						sizes: "48x48 72x72 96x96 128x128 256x256",
						type: "image/png",
					},
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
			},
		})
	].filter(Boolean),
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
}));
