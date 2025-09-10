// Sistema de alertas usando arquivo de som local
// Usa notification-sound.wav da pasta public

export type AlertType =
    | "message" // notificação de mensagem
    | "success" // operação bem-sucedida
    | "warning" // aviso importante
    | "error" // erro na operação
    | "critical" // erro crítico
    | "ring" // toque/chamada
    | "timer" // timer/cronômetro
    | "breakExceeded" // pausa excedida
    | "soft" // notificação suave
    | "whisper" // som muito baixo
    | "gentle" // som gentil
    | "chime" // som de sino
    | "bubble" // som de bolha
    | "breath"; // som suave

export interface AlertOptions {
    volume?: number; // 0.0 - 1.0 (default 0.7)
    rateLimitMs?: number; // evita spam (default 120ms)
    pan?: number; // -1 a 1 (stereo) - não usado no arquivo de som
}

// Cache do audio e controle de rate limiting
let audioCache: HTMLAudioElement | null = null;
let lastPlayAt = 0;

// Função para garantir que o áudio está carregado
function ensureAudio(): HTMLAudioElement {
    if (!audioCache) {
        audioCache = new Audio("/notification-sound.wav");
        audioCache.preload = "auto";

        // Configurações do áudio
        audioCache.addEventListener("error", (e) => {
            console.error("Erro ao carregar notification-sound.wav:", e);
        });

        audioCache.addEventListener("canplaythrough", () => {
            console.log("notification-sound.wav carregado com sucesso");
        });
    }
    return audioCache;
}

// Rate limit simples
function canPlay(rateLimitMs: number): boolean {
    const now = performance.now();
    if (now - lastPlayAt < rateLimitMs) return false;
    lastPlayAt = now;
    return true;
}

/** API pública principal */
export function playAlert(type: AlertType, opts: AlertOptions = {}) {
    const volume = opts.volume ?? 0.7;
    const rateLimitMs = opts.rateLimitMs ?? 120;

    // Verifica rate limiting
    if (!canPlay(rateLimitMs)) {
        console.log("Som ignorado devido ao rate limiting");
        return;
    }

    try {
        const audio = ensureAudio();

        // Clona o áudio para permitir múltiplas reproduções simultâneas se necessário
        const audioInstance = audio.cloneNode() as HTMLAudioElement;

        // Define o volume (0.0 a 1.0)
        audioInstance.volume = Math.max(0, Math.min(1, volume));

        // Para diferentes tipos, podemos ajustar a velocidade de reprodução ou volume
        switch (type) {
            case "soft":
            case "whisper":
            case "gentle":
                audioInstance.volume = Math.min(audioInstance.volume, 0.5);
                break;
            case "warning":
            case "error":
            case "critical":
            case "breakExceeded":
                // Mantém volume original para alertas importantes
                break;
            case "breath":
            case "bubble":
                audioInstance.volume = Math.min(audioInstance.volume, 0.4);
                audioInstance.playbackRate = 0.8; // Mais lento
                break;
            case "chime":
            case "ring":
                audioInstance.playbackRate = 1.1; // Ligeiramente mais rápido
                break;
            default:
                // message, success, timer - configuração padrão
                break;
        }

        console.log(
            `Reproduzindo notification-sound.wav para tipo: ${type} com volume: ${audioInstance.volume}`
        );

        // Reproduz o som
        const playPromise = audioInstance.play();

        // Lida com promises do play() para navegadores modernos
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // Som tocado com sucesso
                })
                .catch((error) => {
                    console.warn(
                        "Erro ao reproduzir som de notificação:",
                        error
                    );
                    // Pode acontecer se o usuário não interagiu com a página ainda
                });
        }

        // Limpa o áudio após terminar para evitar vazamentos de memória
        audioInstance.addEventListener("ended", () => {
            audioInstance.remove();
        });
    } catch (error) {
        console.error("Erro no sistema de som:", error);
    }
}

// Helper de compatibilidade para código legado
export function playAlertSound(audioContext?: AudioContext | null) {
    // Ignora o audioContext pois agora usamos HTMLAudioElement
    playAlert("soft");
}

// Exemplo de uso:
// import { playAlert } from "@/lib/sfx/alerts"
// playAlert("message", { volume: 0.8 })
// playAlert("error")
// playAlert("breakExceeded", { volume: 0.6 })
