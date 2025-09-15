import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"

const THEME_KEY = "theme"
const MONITOR_MODE_KEY = "monitor-mode"
const MONITOR_FONT_SIZE = 40

type Ctx = {
    isDark: boolean
    toggleTheme: () => void

    isMonitorMode: boolean
    toggleMonitorMode: () => void

    isFullscreen: boolean
    enterFullscreen: () => Promise<void>
    exitFullscreen: () => Promise<void>
    toggleFullscreen: () => Promise<void>
}

const UiThemeContext = createContext<Ctx | null>(null)

export function UiThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(false)
    const [isMonitorMode, setIsMonitorMode] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

    // flag para sabermos se o FS foi ligado pelo Modo TV
    const fsByTvRef = useRef(false)

    const applyTheme = (mode: "light" | "dark") => {
        const root = document.documentElement
        mode === "dark" ? root.classList.add("dark") : root.classList.remove("dark")
    }
    const applyMonitorMode = (enabled: boolean) => {
        const root = document.documentElement
        root.classList.toggle("monitor-mode", enabled)
        root.style.fontSize = enabled ? `${MONITOR_FONT_SIZE}px` : ""
    }

    // init theme
    useEffect(() => {
        const saved = (localStorage.getItem(THEME_KEY) as "light" | "dark" | null) ?? null
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        const dark = saved ? saved === "dark" : prefersDark
        setIsDark(dark)
        applyTheme(dark ? "dark" : "light")
        localStorage.setItem(THEME_KEY, dark ? "dark" : "light")

        const mq = window.matchMedia("(prefers-color-scheme: dark)")
        const onChange = () => {
            if (!localStorage.getItem(THEME_KEY)) {
                const sysDark = mq.matches
                setIsDark(sysDark)
                applyTheme(sysDark ? "dark" : "light")
            }
        }
        mq.addEventListener?.("change", onChange)
        return () => mq.removeEventListener?.("change", onChange)
    }, [])

    // init monitor mode
    useEffect(() => {
        const enabled = localStorage.getItem(MONITOR_MODE_KEY) === "on"
        setIsMonitorMode(enabled)
        applyMonitorMode(enabled)
    }, [])

    // observar mudanças reais do browser (FS)
    useEffect(() => {
        const readFs = () => {
            const d: any = document
            const active =
                !!document.fullscreenElement ||
                !!d.webkitFullscreenElement ||
                !!d.mozFullScreenElement ||
                !!d.msFullscreenElement
            setIsFullscreen(active)
        }
        readFs()
        const events = ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"]
        events.forEach((ev) => document.addEventListener(ev, readFs))
        return () => events.forEach((ev) => document.removeEventListener(ev, readFs))
    }, [])

    const enterFullscreen = async () => {
        const el: any = document.documentElement
        try {
            if (el.requestFullscreen) await el.requestFullscreen()
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
            else if (el.mozRequestFullScreen) el.mozRequestFullScreen()
            else if (el.msRequestFullscreen) el.msRequestFullscreen()
        } catch { }
    }

    const exitFullscreen = async () => {
        const d: any = document
        try {
            if (document.exitFullscreen) await document.exitFullscreen()
            else if (d.webkitExitFullscreen) await d.webkitExitFullscreen()
            else if (d.mozCancelFullScreen) await d.mozCancelFullScreen()
            else if (d.msExitFullscreen) await d.msExitFullscreen()
        } catch { }
    }

    const toggleFullscreen = async () => {
        // clique manual: não foi o Modo TV que acionou
        fsByTvRef.current = false
        const d: any = document
        const active =
            !!document.fullscreenElement ||
            !!d.webkitFullscreenElement ||
            !!d.mozFullScreenElement ||
            !!d.msFullscreenElement
        if (active) await exitFullscreen()
        else await enterFullscreen()
    }

    // Regra: ativou Modo TV => garante FS; desativou => só sai se o próprio Modo TV entrou
    useEffect(() => {
        (async () => {
            if (isMonitorMode) {
                if (!isFullscreen) {
                    fsByTvRef.current = true
                    await enterFullscreen()
                }
            } else {
                if (fsByTvRef.current && isFullscreen) {
                    await exitFullscreen()
                    fsByTvRef.current = false
                }
            }
        })()
        // depende de ambos para reagir corretamente
    }, [isMonitorMode, isFullscreen])

    // sync entre abas
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === THEME_KEY) {
                const v = e.newValue as "light" | "dark" | null
                if (v === "dark" || v === "light") {
                    setIsDark(v === "dark"); applyTheme(v)
                } else {
                    const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches
                    setIsDark(sysDark); applyTheme(sysDark ? "dark" : "light")
                }
            }
            if (e.key === MONITOR_MODE_KEY) {
                const enabled = e.newValue === "on"
                setIsMonitorMode(enabled)
                applyMonitorMode(enabled)
            }
        }
        window.addEventListener("storage", onStorage)
        return () => window.removeEventListener("storage", onStorage)
    }, [])

    const toggleTheme = () => {
        const next = !isDark
        setIsDark(next)
        applyTheme(next ? "dark" : "light")
        localStorage.setItem(THEME_KEY, next ? "dark" : "light")
    }

    const toggleMonitorMode = () => {
        const next = !isMonitorMode
        setIsMonitorMode(next)
        applyMonitorMode(next)
        localStorage.setItem(MONITOR_MODE_KEY, next ? "on" : "off")
        // não chama FS aqui; o efeito acima cuida disso e respeita fsByTvRef
    }

    const value = useMemo<Ctx>(
        () => ({
            isDark,
            toggleTheme,
            isMonitorMode,
            toggleMonitorMode,
            isFullscreen,
            enterFullscreen,
            exitFullscreen,
            toggleFullscreen,
        }),
        [isDark, isMonitorMode, isFullscreen]
    )

    return <UiThemeContext.Provider value={value}>{children}</UiThemeContext.Provider>
}

export function useUiTheme() {
    const ctx = useContext(UiThemeContext)
    if (!ctx) throw new Error("useUiTheme must be used within UiThemeProvider")
    return ctx
}