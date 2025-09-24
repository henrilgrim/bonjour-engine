import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { useAgentStatusPoll } from "@/hooks/use-agent-status-poll-options";
import { loginAgent } from "@/lib/firebase/realtime/online";
import { useUiTheme } from "@/contexts/ui-theme";
import { ensureAnonymousSession } from "@/lib/firebase/authentication";
import { useFirebaseProfile } from "@/hooks/use-firebase-profile";
import logo_light from "@/assets/logo-light.svg";
import logo_dark from "@/assets/logo-dark.svg";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const demoAccounts: Record<
    string,
    { extension: string; login: string; password: string }
> = {
    europort: {
        extension: "5959",
        login: "270922",
        password: "270922",
    },
    px1: {
        extension: "2004",
        login: "2004",
        password: "2004",
    },
};

const POLL_MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 5000;

type LoginForm = { extension: string; login: string; password: string };
type Status = "ready" | "authenticating" | "checking-status";

export default function LoginPage() {
    const navigate = useNavigate();
    const { toast, dismiss } = useToast();
    const { isDark } = useUiTheme();

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

    const devMode = process.env.NODE_ENV === "development";
    const PxTalkLogo = isDark ? logo_light : logo_dark;

    return (
        <main className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-4xl shadow-xl border bg-card text-card-foreground rounded-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Lado esquerdo */}
                    <div className="flex flex-col items-center md:items-start justify-start p-8 bg-muted text-center md:text-left space-y-6">
                        <img
                            src={PxTalkLogo}
                            alt="Logo PxTalk"
                            className="max-h-20 sm:max-h-24 w-auto"
                            draggable={false}
                        />
                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold">
                                Painel do Agente
                            </h2>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Sistema de atendimento integrado para analise de
                                chamadas, acesso a filas e gestão de pausas.{" "}
                                <br />
                                <br /> Faça login com suas credenciais para
                                acessar.
                            </p>
                        </div>
                    </div>

                    {/* Lado direito - Login */}
                    <div className="p-6 sm:p-8 flex flex-col justify-center">
                        {/* <CardHeader className="text-center pb-4">
                            <CardTitle className="text-xl font-bold">Acesso</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                Digite seu ramal, login e senha para entrar
                            </CardDescription>
                        </CardHeader> */}

                        <CardContent className="space-y-4">
                            {/* Ramal */}
                            <div className="space-y-1.5">
                                <Label htmlFor="extension">Ramal</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="extension"
                                        placeholder="Digite o número do seu ramal"
                                        className="pl-10"
                                        value={formData.extension}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Login */}
                            <div className="space-y-1.5">
                                <Label htmlFor="login">Login</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="login"
                                        placeholder="Digite seu login"
                                        className="pl-10"
                                        value={formData.login}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Senha */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        placeholder="Sua senha"
                                        className="pl-10 pr-10"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((v) => !v)
                                        }
                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-3">
                            <Button
                                className="w-full"
                                disabled={isSubmitDisabled}
                                onClick={handleSubmit}
                            >
                                {status === "authenticating"
                                    ? "Entrando..."
                                    : status === "checking-status"
                                    ? "Aguardando autorização no telefone..."
                                    : "Entrar"}
                            </Button>

                            {/* Botão DEMO */}
                            <Select
                                onValueChange={(value) => {
                                    const creds = demoAccounts[value];
                                    if (creds) {
                                        setFormData(creds);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Preencher DEMO" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(demoAccounts).map(
                                        ([key]) => (
                                            <SelectItem key={key} value={key}>
                                                {key}
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>
                        </CardFooter>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground text-center p-2 border-t border-border/30">
                    Powered by{" "}
                    <span className="font-semibold text-primary">pxTalk</span>
                </div>
            </Card>
        </main>
    );
}
