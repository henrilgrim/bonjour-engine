import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
    server: {
        host: "::",
        port: 9898,
        allowedHosts: [
            "agente.pxtalk.com.br",
            "localhost",
            "agente.pxtalks.com.br",
        ],
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
                type: "classic",
            },

            includeAssets: [
                "favicon.png",
                "icons/icon-192.png",
                "icons/icon-512.png",
                "icons/maskable-512.png",
            ],

            // MANIFEST
            manifest: {
                name: "PX Agente Portal",
                short_name: "PX Agente",
                description: "Portal do Agente PX Talk",
                start_url: "/",
                scope: "/",
                display: "standalone",
                background_color: "#ffffff",
                theme_color: "#000000",
                icons: [
                    {
                        src: "icons/icon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "icons/icon-512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "icons/maskable-512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable any",
                    },
                ],
            },

            // O cache do app-shell (Workbox) continua funcionando
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
            },
        }),
    ].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
}));
