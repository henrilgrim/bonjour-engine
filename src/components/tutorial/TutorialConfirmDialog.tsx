import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BookOpen, X } from "lucide-react"

interface TutorialConfirmDialogProps {
    open: boolean
    onConfirm: () => void
    onDecline: () => void
    hasNeverDoneTutorial: () => Promise<boolean>
}

export function TutorialConfirmDialog({
    open,
    onConfirm,
    onDecline,
    hasNeverDoneTutorial
}: TutorialConfirmDialogProps) {
    const [isFirstTime, setIsFirstTime] = useState(false)

    useEffect(() => {
        const checkFirstTime = async () => {
            if (open) {
                const neverDone = await hasNeverDoneTutorial()
                setIsFirstTime(neverDone)
            }
        }
        checkFirstTime()
    }, [open, hasNeverDoneTutorial])

    const title = isFirstTime
        ? "Bem-vindo ao PXTalk Agent!"
        : "Tutorial Disponível"

    const description = isFirstTime
        ? "Esta parece ser sua primeira vez usando o sistema. Gostaria de fazer um tutorial para conhecer as funcionalidades?"
        : "Gostaria de refazer o tutorial para relembrar as funcionalidades do sistema?"

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) onDecline() }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>{title}</DialogTitle>
                            <DialogDescription className="text-sm mt-1">
                                {description}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex items-center justify-end gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onDecline}
                        className="gap-2"
                    >
                        <X className="h-4 w-4" />
                        {isFirstTime ? "Pular" : "Não"}
                    </Button>
                    <Button
                        size="sm"
                        onClick={onConfirm}
                        className="bg-gradient-to-r from-primary to-primary/80 gap-2"
                    >
                        <BookOpen className="h-4 w-4" />
                        {isFirstTime ? "Começar Tutorial" : "Refazer Tutorial"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}