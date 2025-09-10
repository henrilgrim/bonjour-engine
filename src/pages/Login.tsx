import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import logo_light from "@/assets/logo-light.png";
import logo_dark from "@/assets/logo-dark.png";

import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { useAgentStatusPoll } from "@/hooks/use-agent-status-poll-options";
import { loginAgent } from "@/lib/firebase/realtime/online";
import { useUiTheme } from "@/contexts/ui-theme";
import { ensureAnonymousSession } from "@/lib/firebase/authentication";
import { useFirebaseProfile } from "@/hooks/use-firebase-profile";
// import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt"

const POLL_MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 5000;

type LoginForm = { extension: string; login: string; password: string };
type Status = "ready" | "authenticating" | "checking-status";

export default function LoginPage() {
    const navigate = useNavigate();
    const { toast, dismiss } = useToast();
    const { isDark } = useUiTheme();
    const logoSrc = isDark ? logo_light : logo_dark;

    const [status, setStatus] = useState<Status>("ready");
    const [formData, setFormData] = useState<LoginForm>({
        extension: "",
        login: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const retriedRef = useRef(false); // controla retry do "Sessão anterior desconectada…"

    // stores
    const company = useAppStore((s) => s.company);
    const code = useAppStore((s) => s.code);
    const checkExtensionRegistered = useAppStore(
        (s) => s.checkExtensionRegistered
    );

    const signIn = useAuthStore((s) => s.signIn);
    const checkStatusAgent = useAppStore((s) => s.checkAgentStatus);
    const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);

    const user = useAuthStore((s) => s.user);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    // Hook do Firebase Profile para verificação e criação
    const { checkProfileExists, createProfile, syncProfileWithUserData } =
        useFirebaseProfile({
            autoCreate: false,
        });

    useEffect(() => {
        if (!company?.accountcode || !code) {
            navigate("/company-not-found");
        }
    }, [company, code, navigate]);

    useEffect(() => {
        if (user && !isAuthenticated) {
            setFormData({
                extension: user.extension || "",
                login: user.login || "",
                password: user.password || "", // depende se `password` está salvo
            });
        }
    }, [user, isAuthenticated]);

    // polling
    const { start: startPoll, running: polling } = useAgentStatusPoll({
        checkStatusAgent,
        toast,
        dismiss,
        pollIntervalMs: POLL_INTERVAL_MS,
        maxAttempts: POLL_MAX_ATTEMPTS,
        onSuccess: async () => {
            const user = useAuthStore.getState().user;

            // Criar sessão anônima no Firebase primeiro
            try {
                await ensureAnonymousSession();

                if (user && company) {
                    await loginAgent({ user, company });

                    const profileExists = await checkProfileExists(
                        company.accountcode,
                        user.id
                    );

                    if (!profileExists) {
                        try {
                            await createProfile(user.id, company.accountcode, {
                                userId: user.id,
                                name:
                                    user.name ||
                                    user.login ||
                                    `Agente ${user.extension}`,
                                description: `Profile criado automaticamente para ${
                                    user.name || user.login
                                }`,
                                isActive: true,
                                queues: [],
                                roles: [],
                                createdBy: user.id,
                                updatedBy: user.id,
                            });

                            console.log("Profile criado automaticamente");
                        } catch (createError) {
                            console.error(
                                "Erro ao criar profile:",
                                createError
                            );
                        }
                    } else {
                        // Profile existe, verificar se dados mudaram e atualizar
                        try {
                            const wasUpdated = await syncProfileWithUserData(
                                company.accountcode,
                                user.id,
                                {
                                    name: user.name,
                                    login: user.login,
                                    extension: user.extension,
                                }
                            );

                            if (wasUpdated) {
                                console.log(
                                    "Profile atualizado com dados mais recentes"
                                );
                            }
                        } catch (syncError) {
                            console.error(
                                "Erro ao sincronizar profile:",
                                syncError
                            );
                        }
                    }
                }
            } catch (error) {
                console.error(
                    "Erro ao verificar profile ou criar sessão Firebase:",
                    error
                );
            }

            setIsAuthenticated(true);
            navigate("/home");
        },
        onTimeout: () => {
            toast({
                title: "Não foi possível confirmar o login.",
                description: "Autorize no telefone e tente novamente.",
                variant: "destructive",
            });
        },
        onError: () => {
            toast({
                title: "Erro ao verificar status",
                description: "Tente novamente em instantes.",
                variant: "destructive",
            });
        },
    });

    const isSubmitDisabled = useMemo(
        () =>
            polling ||
            status === "authenticating" ||
            status === "checking-status" ||
            !formData.extension ||
            !formData.login ||
            !formData.password,
        [polling, status, formData]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { id, value } = e.target;
            setFormData((prev) => ({ ...prev, [id]: value }));
        },
        []
    );

    const validate = (): { ok: boolean; msg?: string; data?: LoginForm } => {
        const ext = String(formData.extension || "").trim();
        const login = String(formData.login || "").trim();
        const pass = String(formData.password || "").trim();

        if (!ext || !login || !pass)
            return {
                ok: false,
                msg: "Preencha todos os campos para continuar.",
            };

        return { ok: true, data: { extension: ext, login, password: pass } };
    };

    const handleSubmit = useCallback(async () => {
        if (status !== "ready") return;

        const validation = validate();
        if (!validation.ok)
            return toast({
                title: "Validação",
                description: validation.msg,
                variant: "destructive",
            });

        const validatedData = validation.data!;
        setStatus("authenticating");

        try {
            // 1) valida extensão
            const extenRes = await checkExtensionRegistered(
                company.accountcode,
                validatedData.extension
            );
            if (extenRes?.error) {
                setStatus("ready");
                return toast({
                    title: "Ramal não registrado",
                    description:
                        extenRes?.message ||
                        "Verifique se seu ramal está registrado no PBX.",
                    variant: "destructive",
                });
            }

            // 2) sign in
            const res = await signIn(
                validatedData.extension,
                validatedData.login,
                validatedData.password
            );

            // caso especial: sessão anterior desconectada -> tentar uma vez automaticamente
            if (
                !res.error &&
                res.message &&
                /sess[aã]o anterior desconectada/i.test(res.message) &&
                !retriedRef.current
            ) {
                retriedRef.current = true;
                toast({
                    title: "Sessão anterior finalizada",
                    description: "Tentando login novamente…",
                    variant: "info",
                });
                const retry = await signIn(
                    validatedData.extension,
                    validatedData.login,
                    validatedData.password
                );
                if (retry.error) {
                    setStatus("ready");
                    retriedRef.current = false;
                    return toast({
                        title: "Erro ao efetuar o login",
                        description: retry.message || "Tente novamente.",
                        variant: "destructive",
                    });
                }
            } else if (res.error) {
                setStatus("ready");
                retriedRef.current = false;
                return toast({
                    title: "Erro ao efetuar o login",
                    description:
                        res.message ||
                        "Credenciais inválidas ou problema de conexão.",
                    variant: "destructive",
                });
            }

            // sucesso de signIn: user está no store
            // 3) inicia polling aguardando autorização no telefone
            retriedRef.current = false;
            setStatus("checking-status");
            const ok = await startPoll();
            if (!ok) setStatus("ready");
        } catch (e: any) {
            console.error(e);
            retriedRef.current = false;
            toast({
                title: "Falha inesperada",
                description:
                    e?.message ||
                    "Ocorreu um erro ao tentar entrar. Tente novamente.",
                variant: "destructive",
            });
            setStatus("ready");
        }
    }, [
        company,
        status,
        formData,
        signIn,
        toast,
        checkExtensionRegistered,
        startPoll,
    ]);

    const dev_mode = process.env.NODE_ENV === "development";

    return (
        <main className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
            <Card className="w-full max-w-md bg-card/80 shadow-2xl">
                <CardHeader className="text-center space-y-2">
                    <div className="relative w-[200px] h-[80px] mx-auto">
                        <img
                            src={logoSrc}
                            alt="Painel do Agente"
                            className="object-contain w-full h-full"
                        />
                    </div>

                    <CardDescription className="text-sm text-muted-foreground">
                        Entre com suas credenciais para acessar o sistema
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* <PWAInstallPrompt /> */}
                    <div className="space-y-2">
                        <Label htmlFor="extension">Ramal</Label>
                        <div className="relative">
                            <Phone
                                className="absolute left-3 inset-y-0 my-auto h-4 w-4 text-muted-foreground"
                                aria-hidden
                            />
                            <Input
                                id="extension"
                                inputMode="numeric"
                                placeholder="Digite o seu ramal"
                                className="pl-10 bg-input border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                                required
                                value={formData.extension}
                                onChange={handleChange}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                aria-invalid={!!formData.extension}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="login">Login</Label>
                        <div className="relative">
                            <User
                                className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                                aria-hidden
                            />
                            <Input
                                id="login"
                                placeholder="Seu login de agente"
                                className="pl-10 bg-input border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                                required
                                value={formData.login}
                                onChange={handleChange}
                                autoComplete="username"
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleSubmit()
                                }
                                aria-invalid={!!formData.login}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                            <Lock
                                className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                                aria-hidden
                            />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Sua senha"
                                className="pl-10 pr-10 bg-input border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleSubmit()
                                }
                                aria-describedby="password-helper"
                                aria-invalid={!!formData.password}
                            />
                            <button
                                type="button"
                                aria-label={
                                    showPassword
                                        ? "Ocultar senha"
                                        : "Mostrar senha"
                                }
                                className="absolute right-2 top-2.5 p-1 rounded-md hover:bg-accent"
                                onClick={() => setShowPassword((v) => !v)}
                                tabIndex={0}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        <p id="password-helper" className="sr-only">
                            Pressione o botão para alternar a visualização da
                            senha.
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="button"
                        className="w-full font-semibold transition-all duration-200"
                        disabled={isSubmitDisabled}
                        onClick={handleSubmit}
                    >
                        {status === "authenticating"
                            ? "Entrando..."
                            : status === "checking-status"
                            ? "Aguardando autorização no telefone..."
                            : "Entrar"}
                    </Button>

                    {dev_mode && (
                        <div className="mt-2 text-center">
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                    setFormData({
                                        extension: "300",
                                        login: "102",
                                        password: "102",
                                    })
                                }
                            >
                                Preencher DEMO
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </main>
    );
}
