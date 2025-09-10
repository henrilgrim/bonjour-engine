# 📚 API Documentation

Esta documentação descreve a estrutura padronizada de APIs e hooks do sistema.

## 🏗️ Arquitetura

```
src/lib/api/
├── base.ts          # Configuração base do Axios
├── services.ts      # Serviços organizados por domínio
├── types.ts         # Tipos TypeScript para APIs
└── README.md        # Esta documentação

src/hooks/api/
├── useAuth.ts       # Hooks de autenticação
├── useDashboard.ts  # Hooks de dashboard
├── useRealtime.ts   # Hooks de tempo real
└── [outros hooks]   # Hooks específicos por domínio
```

## 🚀 Guia de Uso

### 1. Configuração Base

O sistema usa interceptors do Axios para:
- ✅ Tratamento automático de erros
- 🔐 Injeção automática de tokens
- 📝 Logging em desenvolvimento
- ⏱️ Timeout configurável (30s)

### 2. Serviços de API

#### AuthApiService
```typescript
import { AuthApiService } from '@/lib/api/services'

// API pública (login)
const publicApi = AuthApiService.public()
await publicApi.post('/login', credentials)

// API privada (operações autenticadas)
const privateApi = AuthApiService.private(token)
await privateApi.get('/profile')
```

#### PxTalkApiService
```typescript
import { PxTalkApiService } from '@/lib/api/services'

// API v2 (recomendada)
const api = PxTalkApiService.private(token)
await api.get('/users')

// API v1 (legado)
const apiV1 = PxTalkApiService.privateV1(token)
await apiV1.get('/legacy-endpoint')
```

### 3. Hooks de Autenticação

#### useLogin
```typescript
import { useLogin } from '@/hooks/api/useAuth'

function LoginForm() {
  const { login, isLoading, error } = useLogin()

  const handleSubmit = async (credentials) => {
    const success = await login(credentials)
    if (success) {
      // Redirecionar usuário
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <button disabled={isLoading}>
        {isLoading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
```

#### useAuthenticatedUser
```typescript
import { useAuthenticatedUser } from '@/hooks/api/useAuth'

function UserProfile() {
  const { user, isAuthenticated, updateProfile, tvMode, toggleTvMode } = useAuthenticatedUser()

  if (!isAuthenticated) return <LoginPrompt />

  return (
    <div>
      <h1>Olá, {user?.nome}</h1>
      <button onClick={toggleTvMode}>
        Modo TV: {tvMode ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}
```

### 4. Hooks de Dashboard

#### useDashboards
```typescript
import { useDashboards } from '@/hooks/api/useDashboard'

function DashboardList() {
  const { 
    dashboards, 
    loading, 
    error, 
    search, 
    setSearch, 
    refresh 
  } = useDashboards({
    onError: (err) => toast.error(err)
  })

  return (
    <div>
      <input 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar dashboards..."
      />
      
      {loading && <div>Carregando...</div>}
      {error && <div className="error">{error}</div>}
      
      {dashboards.map(dash => (
        <DashboardCard key={dash.id} dashboard={dash} />
      ))}
      
      <button onClick={refresh}>Atualizar</button>
    </div>
  )
}
```

#### useCreateDashboard
```typescript
import { useCreateDashboard } from '@/hooks/api/useDashboard'

function CreateDashboardForm() {
  const { createDash, isLoading, error } = useCreateDashboard({
    onSuccess: (id) => {
      toast.success('Dashboard criado!')
      navigate(`/dashboard/${id}`)
    },
    onError: (err) => toast.error(err)
  })

  const handleSubmit = async (formData) => {
    await createDash({
      nome: formData.name,
      descricao: formData.description,
      accountcode: user.accountcode,
      visible: true
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <button disabled={isLoading}>
        {isLoading ? 'Criando...' : 'Criar Dashboard'}
      </button>
    </form>
  )
}
```

### 5. Hooks de Tempo Real

#### useRealtimeQueues
```typescript
import { useRealtimeQueues } from '@/hooks/api/useRealtime'

function QueueMonitor() {
  const { 
    queues, 
    connected, 
    error, 
    lastUpdate,
    reconnect 
  } = useRealtimeQueues({
    enabled: true,
    onConnect: () => toast.success('Conectado ao tempo real'),
    onError: (err) => toast.error(err)
  })

  return (
    <div>
      <div className="connection-status">
        Status: {connected ? '🟢 Conectado' : '🔴 Desconectado'}
        {lastUpdate && <span>Última atualização: {lastUpdate.toLocaleTimeString()}</span>}
      </div>

      {error && (
        <div className="error">
          {error}
          <button onClick={reconnect}>Reconectar</button>
        </div>
      )}

      {queues.map(queue => (
        <QueueCard key={queue.id} data={queue.data} />
      ))}
    </div>
  )
}
```

#### useRealtimeData (Combinado)
```typescript
import { useRealtimeData } from '@/hooks/api/useRealtime'

function DashboardRealtime() {
  const {
    queues,
    totalizadores,
    connected,
    errors,
    lastUpdate,
    disconnect,
    reconnect
  } = useRealtimeData({
    enabled: true,
    onData: (data) => {
      // Processa dados recebidos
      updateMetrics(data)
    }
  })

  return (
    <div>
      <ConnectionIndicator 
        connected={connected.all}
        lastUpdate={lastUpdate}
        onReconnect={reconnect}
      />

      <QueueMetrics 
        queues={queues}
        totalizadores={totalizadores}
      />
    </div>
  )
}
```

## 🔧 Patterns e Boas Práticas

### 1. Tratamento de Erros
```typescript
// ✅ Bom: Hook trata o erro
const { data, error } = useApiHook()
if (error) return <ErrorMessage error={error} />

// ❌ Evitar: Try/catch manual
try {
  const response = await api.get('/data')
} catch (error) {
  // Tratamento manual
}
```

### 2. Loading States
```typescript
// ✅ Bom: Estado de loading do hook
const { data, loading } = useApiHook()
return loading ? <Spinner /> : <DataComponent data={data} />

// ✅ Bom: Loading para mutações
const { mutate, isLoading } = useMutationHook()
<button disabled={isLoading} onClick={mutate}>
  {isLoading ? 'Salvando...' : 'Salvar'}
</button>
```

### 3. Reatividade
```typescript
// ✅ Bom: Usa callbacks do hook
const { data, refresh } = useApiHook({
  onSuccess: (data) => {
    // Atualiza outras partes da UI
    updateRelatedData(data)
  }
})

// ✅ Bom: Refresh manual quando necessário
<button onClick={refresh}>Atualizar</button>
```

### 4. Performance
```typescript
// ✅ Bom: Desabilita quando não necessário
const { data } = useApiHook({ 
  enabled: isVisible && hasPermission 
})

// ✅ Bom: Limpa recursos quando não usar
useEffect(() => {
  return () => disconnect()
}, [])
```

## 🔍 Debugging

### Logs de Desenvolvimento
Em modo de desenvolvimento, o sistema registra automaticamente:
- 🚀 Requisições HTTP
- ✅ Respostas bem-sucedidas  
- ❌ Erros de API
- 🔌 Conexões de tempo real

### Network Tab
Use as ferramentas de desenvolvedor para inspecionar:
- Headers de autenticação
- Payloads de requisição
- Códigos de status
- Tempos de resposta

### Error Boundaries
```typescript
// Use Error Boundaries para capturar erros de hooks
<ErrorBoundary fallback={<ErrorPage />}>
  <ComponentWithApiHooks />
</ErrorBoundary>
```

## 🚦 Estados de Conexão

| Estado | Descrição | Ação |
|--------|-----------|------|
| 🟢 `connected: true` | Conectado e recebendo dados | Normal |
| 🟡 `loading: true` | Estabelecendo conexão | Aguardar |
| 🔴 `error !== null` | Erro na conexão | Reconectar |
| ⚫ `enabled: false` | Desabilitado | Habilitar |

## 📋 Checklist de Implementação

Para criar novos hooks de API:

- [ ] Definir tipos no `types.ts`
- [ ] Criar serviço no `services.ts` se necessário
- [ ] Implementar hook com padrão consistente
- [ ] Adicionar tratamento de erro
- [ ] Incluir loading states
- [ ] Documentar com exemplos
- [ ] Testar cenários de erro
- [ ] Adicionar logs de debug

## 🔗 Links Úteis

- [Axios Documentation](https://axios-http.com/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [React Hooks Best Practices](https://react.dev/reference/react)