export interface Reason {
    id: string
    name: string
    productivePause: boolean
    timePause: number // em segundos
    needsApproval?: boolean
}

export interface PauseDialogProps {
    open: boolean
    setOpen: (open: boolean) => void
}

export interface PauseButtonProps {
    setOpenDialogBreakReasons: (open: boolean) => void
}

export interface PauseAlertProps {
    currentPauseReason: string
    progress: number
    onCancel?: () => void
    onEnd?: () => void
    showEnterAnimation?: boolean
}

export interface AlertDialogProps {
    open: boolean
    onClose: () => void
    currentPauseReason: string
    pauseTime: number
    pauseDuration: number
    handleEndPause: () => void
    formatTime: (seconds: number) => string
}

export interface ExceedAlertProps extends AlertDialogProps {
    timeExceededBy: number
}

export interface WaitingApprovalProps {
    reasonName: string
    startedAt: number
    loading: boolean
    onCancel: () => void
    showEnterAnimation?: boolean
}