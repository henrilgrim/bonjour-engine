import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"

const THEME_KEY = "theme"
const MONITOR_MODE_KEY = "monitor-mode"
const MONITOR_FONT_SIZE = 40

type Ctx = {
    isDark: boolean
    toggleTheme: () => void
}

const UiThemeContext = createContext<Ctx | null>(null)

export function UiThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(false)

    const applyTheme = (mode: "light" | "dark") => {
        const root = document.documentElement
        mode === "dark" ? root.classList.add("dark") : root.classList.remove("dark")
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

    const value = useMemo<Ctx>(
        () => ({
            isDark,
            toggleTheme,
        }),
        [isDark]
    )

    return <UiThemeContext.Provider value={value}>{children}</UiThemeContext.Provider>
}

export function useUiTheme() {
    const ctx = useContext(UiThemeContext)
    if (!ctx) throw new Error("useUiTheme must be used within UiThemeProvider")
    return ctx
}