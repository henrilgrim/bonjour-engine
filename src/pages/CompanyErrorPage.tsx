import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { useEffect } from "react"
import { useAppStore } from "@/store/appStore"
import { useAuthStore } from "@/store/authStore"

export default function CompanyErrorPage() {
    const navigate = useNavigate()

    const code = useAppStore(s => s.code)
    const company = useAppStore(s => s.company)
    const isAuthenticated = useAuthStore(s => s.isAuthenticated)

    const hasCompanyAndCode = Boolean(company) && Boolean(code)

    useEffect(() => {
        if (hasCompanyAndCode) {
            navigate(isAuthenticated ? "/home" : "/login", { replace: true })
        }
    }, [hasCompanyAndCode, isAuthenticated, navigate])

    if (hasCompanyAndCode) return null

    return (
        <main className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
            <Card className="max-w-md w-full border border-destructive/30 shadow-md">
                <CardHeader className="flex items-center text-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">Empresa não identificada</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Não conseguimos identificar a empresa associada a este link.
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="text-center">
                    <span className="text-sm text-muted-foreground">
                        Verifique a URL ou entre em contato com o suporte técnico.
                    </span>
                </CardContent>
            </Card>
        </main>
    )
}
