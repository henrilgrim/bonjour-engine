import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useNotifications } from "@/hooks/use-notifications";
import { useOptimizedRealtimeAgents } from "@/hooks/use-optimized-realtime-agents";
import { Bell, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
    title: z.string().min(1, "Título é obrigatório").max(100, "Título deve ter no máximo 100 caracteres"),
    message: z.string().min(1, "Mensagem é obrigatória").max(500, "Mensagem deve ter no máximo 500 caracteres"),
    targetAgents: z.array(z.string()).min(1, "Selecione pelo menos um agente"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateNotificationDialogProps {
    accountcode: string;
    children?: React.ReactNode;
}

export function CreateNotificationDialog({
    accountcode,
    children,
}: CreateNotificationDialogProps) {
    const [open, setOpen] = useState(false);
    const { createNotification, creating } = useNotifications({ accountcode });
    const { orderedAgents: agents } = useOptimizedRealtimeAgents();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            message: "",
            targetAgents: [],
        },
    });

    const onSubmit = async (data: FormData) => {
        try {
            await createNotification({
                title: data.title,
                message: data.message,
                targetAgents: data.targetAgents,
            });
            form.reset();
            setOpen(false);
        } catch (error) {
            // Erro já tratado no hook
        }
    };

    const selectedAgents = form.watch("targetAgents");
    const selectAll = () => {
        const allAgentLogins = agents.map(agent => agent.login);
        form.setValue("targetAgents", allAgentLogins);
    };

    const clearAll = () => {
        form.setValue("targetAgents", []);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button>
                        <Bell className="w-4 h-4 mr-2" />
                        Nova Notificação
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Nova Notificação</DialogTitle>
                    <DialogDescription>
                        Envie uma notificação para os agentes selecionados
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Título da notificação" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mensagem</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Digite sua mensagem..."
                                            className="min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="targetAgents"
                            render={() => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Agentes ({selectedAgents.length} selecionados)</FormLabel>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={selectAll}
                                            >
                                                Todos
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={clearAll}
                                            >
                                                Limpar
                                            </Button>
                                        </div>
                                    </div>
                                    <ScrollArea className="h-[200px] border rounded-md p-3">
                                        <div className="space-y-2">
                                            {agents.map((agent) => (
                                                <FormField
                                                    key={agent.login}
                                                    control={form.control}
                                                    name="targetAgents"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(agent.login)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, agent.login])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== agent.login
                                                                                )
                                                                            );
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="text-sm font-normal">
                                                                {agent.displayName || agent.fullName || agent.login}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </ScrollArea>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={creating}>
                                <Send className="w-4 h-4 mr-2" />
                                {creating ? "Enviando..." : "Enviar"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}