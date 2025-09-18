import type { Step } from "react-joyride"
import type { Reason } from "../types"
export * from "./time-info"

export const fmtDuration = (secs: number) => {
    if (!secs) return "Sem tempo"
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

const basePausesSteps: Step[] = [
    {
        target: ".tour-pause-modal",
        content: "Este modal permite que você solicite pausas. Aqui você pode ver todos os motivos disponíveis.",
        placement: "center",
        disableBeacon: true,
    },
    {
        target: ".tour-pause-grid",
        content: "Aqui estão todos os motivos de pausa disponíveis. Cada card mostra informações importantes como duração e tipo.",
        placement: "bottom",
        disableBeacon: true,
    },
    {
        target: ".tour-pause-card",
        content: "Clique em um card para selecioná-lo. Veja as informações: se é produtiva, tempo disponível e se precisa aprovação.",
        placement: "right",
        disableBeacon: true,
    },
]

export const getConditionalPauseSteps = (reasons: Reason[]): Step[] => {
    const hasApprovalReason = reasons.some(r => r.needsApproval)
    const hasProductiveReason = reasons.some(r => r.productivePause)
    const hasImproductiveReason = reasons.some(r => !r.productivePause)

    const steps: Step[] = [...basePausesSteps]

    if (hasApprovalReason) {
        steps.push({
            title: "Pausas que precisam de aprovação",
            target: ".tour-pause-approval",
            content: "Algumas pausas exigem aprovação do supervisor. Elas aparecem com este selo vermelho.",
            placement: "top",
            disableBeacon: true,
        })
    }

    if (hasProductiveReason) {
        steps.push({
            title: "Pausas produtivas",
            target: ".tour-pause-productive",
            content: "Pausas produtivas são pausas permitidas pelo processo e não devem penalizar suas métricas.",
            placement: "top",
            disableBeacon: true,
        })
    }

    if (hasImproductiveReason) {
        steps.push({
            title: "Pausas não produtivas",
            target: ".tour-pause-improductive",
            content: "Pausas não produtivas podem afetar suas métricas. Use-as com moderação.",
            placement: "top",
            disableBeacon: true,
        })
    }

    steps.push(
        {
            target: ".tour-pause-start",
            content: "Depois de selecionar um motivo, clique aqui para iniciar sua pausa.",
            placement: "left",
            disableBeacon: true,
        },
        {
            target: ".tour-pause-cancel",
            content: "Se mudou de ideia, feche o modal clicando em Cancelar.",
            placement: "right",
            disableBeacon: true,
        },
    )

    return steps
}