import { useAppStore } from "@/store/appStore";
import { Coffee } from "lucide-react";
import type { PauseButtonProps } from "../types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-logout";
import { useNavigate } from "react-router-dom";

export function PauseButton({ setOpenDialogBreakReasons }: PauseButtonProps) {
    const { checkExtensionStatus, checkAgentStatus } = useAppStore();
    const { toast, dismiss } = useToast();
    const { logout } = useLogout();
    const navigate = useNavigate();

    const handleOpenDialogBreakReasons = async () => {
        const statusResult = await checkExtensionStatus();
        const agentResult = await checkAgentStatus();

        if (agentResult.error) {
            if (agentResult.message === "Agente não está logado") {
                const toastObj = toast({
                    variant: "destructive",
                    description: (
                        <div className="flex flex-col items-start gap-3 text-left">
                            <div>
                                <h4 className="font-semibold text-sm">
                                    Agente não está logado
                                </h4>
                                <p className="text-sm text-foreground">
                                    Clique abaixo para tentar logar novamente.
                                </p>
                            </div>

                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={async () => {
                                    toastObj.dismiss(); // 👈 Aqui está a correção
                                    await logout();
                                    navigate("/login");
                                }}
                            >
                                Fazer login novamente
                            </Button>
                        </div>
                    ),
                });
            } else {
                toast({
                    title: "Erro ao verificar o status do agente.",
                    description:
                        agentResult.message ||
                        "Erro ao verificar o status do agente.",
                    variant: "destructive",
                });
            }
            return;
        }

        if (statusResult.error) {
            toast({
                title: "Erro ao verificar o status da extensão.",
                description:
                    statusResult.message ||
                    "Erro ao verificar o status da extensão.",
                variant: "destructive",
            });
            return;
        }

        setOpenDialogBreakReasons(true);
    };

    return (
        <button
            onClick={handleOpenDialogBreakReasons}
            aria-label="Abrir motivos de pausa"
            className="group fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full shadow-lg bg-yellow-400 hover:bg-yellow-500 text-black transition-all duration-300 w-[60px] h-[60px] hover:w-[160px] overflow-hidden"
        >
            <Coffee className="h-6 w-6 flex-shrink-0 transition-opacity duration-200 group-hover:opacity-0" />

            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 text-base font-extrabold">
                PAUSAR
            </span>
        </button>
    );
}
