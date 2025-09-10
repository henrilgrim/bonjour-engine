import { useEffect } from "react";

type Props = {
    /** Nome da chave no localStorage */
    requiredKey?: string;
    /** Valor esperado opcional */
    requiredValue?: string;
    /** permite forçar ativar/desativar (ex.: em testes) */
    forceEnabled?: boolean;
};

const DevToolsProtection = ({ requiredKey = "PX_SECRET", requiredValue, forceEnabled }: Props) => {
    useEffect(() => {
        // 🔹 1) Captura secret da URL
        const params = new URLSearchParams(window.location.search);
        const secret = params.get("secret");
        if (secret) {
            localStorage.setItem(requiredKey, secret);
            // opcional: limpar da URL para não ficar visível
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // 🔹 2) Ativo somente em PRODUÇÃO (ou se forçado)
        const isProd =
            (typeof import.meta !== "undefined" && (import.meta as any)?.env?.PROD === true) ||
            (typeof process !== "undefined" && process.env?.NODE_ENV === "production");

        const enabledByEnv = forceEnabled ?? isProd;
        if (!enabledByEnv) return;

        // 🔹 3) Verifica se existe chave no localStorage
        let hasBypass = false;
        try {
            const val = localStorage.getItem(requiredKey);
            hasBypass = !!val && (requiredValue ? val === requiredValue : true);
        } catch {
            hasBypass = false;
        }

        if (hasBypass) return; // Se a chave estiver OK, não aplica proteção

        // 🔹 4) Proteção original
        const detectDevTools = () => {
            // const threshold = 160;
            // const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            // const heightThreshold = window.outerHeight - window.innerHeight > threshold;

            // if (widthThreshold || heightThreshold) {
            //     alert("🚫 DevTools detectado! Por favor, feche as ferramentas de desenvolvedor.");
            // }
        };
        const interval = setInterval(detectDevTools, 1000);

        let devtools = { open: false as boolean, orientation: null as any };
        const element = new Image();
        Object.defineProperty(element, "id", {
            get: function () {
                devtools.open = true;
                console.clear();
                console.log("%c🚫 ACESSO NEGADO", "color: red; font-size: 50px; font-weight: bold;");
                console.log("%cEste sistema é protegido contra inspeção.", "color: red; font-size: 16px;");
                debugger;
                return "devtools-detected";
            },
        });
        console.log(element);

        const disableKeys = (e: KeyboardEvent) => {
            if (e.keyCode === 123) { e.preventDefault(); alert("🚫 F12 foi desabilitado!"); }
            if (e.ctrlKey && e.shiftKey && e.keyCode === 73) { e.preventDefault(); alert("🚫 DevTools foi desabilitado!"); }
            if (e.ctrlKey && e.shiftKey && e.keyCode === 74) { e.preventDefault(); alert("🚫 Console foi desabilitado!"); }
            if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); alert("🚫 Visualizar código-fonte foi desabilitado!"); }
            if (e.ctrlKey && e.shiftKey && e.keyCode === 67) { e.preventDefault(); alert("🚫 Inspetor de elementos foi desabilitado!"); }
        };

        const disableContextMenu = (e: MouseEvent) => { e.preventDefault(); alert("🚫 Menu de contexto foi desabilitado!"); };
        const disableSelection = (e: Event) => { e.preventDefault(); };

        document.addEventListener("keydown", disableKeys);
        document.addEventListener("contextmenu", disableContextMenu);
        document.addEventListener("selectstart", disableSelection);
        document.addEventListener("dragstart", disableSelection);

        return () => {
            clearInterval(interval);
            document.removeEventListener("keydown", disableKeys);
            document.removeEventListener("contextmenu", disableContextMenu);
            document.removeEventListener("selectstart", disableSelection);
            document.removeEventListener("dragstart", disableSelection);
        };
    }, [requiredKey, requiredValue, forceEnabled]);

    return null;
};

export default DevToolsProtection;
