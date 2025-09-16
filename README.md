# Monitor PXTALK — Guia de Release & Deploy

Este README descreve como versionar, como publicar e como operar o app em produção usando branches `dev` → `main` e PM2 no servidor.  
Inclui também dicas de quando usar `patch` / `minor` / `major` (SemVer), scripts, e resolução de problemas comuns.

---

## 📚 Sumário

- [Monitor PXTALK — Guia de Release \& Deploy](#monitor-pxtalk--guia-de-release--deploy)
  - [📚 Sumário](#-sumário)
  - [🔁 Fluxo de branches](#-fluxo-de-branches)
  - [🔖 Versionamento (SemVer) — quando usar patch/minor/major](#-versionamento-semver--quando-usar-patchminormajor)
    - [PATCH (`x.y.Z`)](#patch-xyz)
    - [MINOR (`x.Y.z`)](#minor-xyz)
    - [MAJOR (`X.y.z`)](#major-xyz)
    - [Regra prática:](#regra-prática)
  - [🚀 Passo a passo de release (local)](#-passo-a-passo-de-release-local)
  - [🖥️ Deploy no servidor (primeira vez)](#️-deploy-no-servidor-primeira-vez)
  - [🔁 Deploy no servidor (próximos)](#-deploy-no-servidor-próximos)
  - [📜 Scripts úteis](#-scripts-úteis)
  - [📁 Arquivos gerados no build](#-arquivos-gerados-no-build)
  - [⚙️ PM2 — dicas rápidas](#️-pm2--dicas-rápidas)
  - [🧯 Resolução de problemas](#-resolução-de-problemas)

---

## 🔁 Fluxo de branches

- `dev`: desenvolvimento; integrações diárias.  
- `main`: produção; só recebe PR/merge vindo de `dev` (ou hotfixes emergenciais).

**Recomendação:** faça PR de `dev` → `main` e aprove após revisão.  
O bump de versão (`npm version`) pode ser feito na `main` após o merge, garantindo que a tag represente exatamente o que está em produção.

---

## 🔖 Versionamento (SemVer) — quando usar patch/minor/major

Usamos [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`

### PATCH (`x.y.Z`)
Correções pequenas e compatíveis (bugfixes, ajustes de UI, melhorias sem alterar contrato de API).  
Ex.: `1.4.3` → `1.4.4`

### MINOR (`x.Y.z`)
Novas funcionalidades compatíveis com versões anteriores.  
Ex.: `1.4.3` → `1.5.0`

### MAJOR (`X.y.z`)
Mudanças incompatíveis (break changes), remoção/alteração de contratos, modificações estruturais.  
Ex.: `1.5.0` → `2.0.0`

### Regra prática:

- Bugfix? → `npm version patch`
- Feature sem quebrar nada? → `npm version minor`
- Quebrou compatibilidade? → `npm version major`

---

## 🚀 Passo a passo de release (local)

```bash
# Garanta que dev está atualizada
git checkout dev
git pull --ff-only

# Abra PR de dev → main e faça o merge.
# OU, se fizer local (menos recomendado):
git checkout main
git pull --ff-only
git merge --no-ff dev

# Bump de versão na main:
npm version patch   # ou: npm version minor | npm version major

# cria commit + tag vX.Y.Z automaticamente
git push origin main --tags
```

⚠️ **Importante**: não crie tags manualmente após `npm version`. Ela já criou a tag `vX.Y.Z`.

---

## 🖥️ Deploy no servidor (primeira vez)

No servidor (já com Node/PM2 instalados):

```bash
cd /caminho/do/projeto
git fetch --all --prune
git checkout main
git pull --ff-only

# Sobe com PM2 (usa o script de deploy)
bash ./deploy.sh start

pm2 status
pm2 save           # para restaurar na reinicialização
pm2 startup        # (uma vez, se ainda não configurado)
```

O `deploy.sh start` executa:

1. `npm ci` (ou `npm install` se não houver lock)
2. `npm run build` (gera artefatos e arquivos de versão)
3. `pm2 start "npm run preview -- --port 9191 --host" --name monitor-pxtalk`

Se estiver atrás de Nginx/Proxy, usar `--host` é importante para aceitar conexões externas.

---

## 🔁 Deploy no servidor (próximos)

```bash
cd /caminho/do/projeto
git fetch --all --prune
git checkout main
git pull --ff-only

bash ./deploy.sh restart   # rebuild + restart
pm2 status
pm2 logs monitor-pxtalk --lines 50
```

---

## 📜 Scripts úteis

No `package.json`, crie os atalhos:

```json
{
  "scripts": {
    "pm2:start": "bash ./deploy.sh start",
    "pm2:restart": "bash ./deploy.sh restart",
    "build": "vite build",
    "prebuild": "node ./scripts/write-build-meta.ts"
  }
}
```

O script `write-build-meta.ts` deve:

- Gerar `public/version.json` com `{ buildId, builtAt, commit }`
- Gerar `src/build-meta.ts` com:

```ts
export const BUILD_ID = "…";
export const builtAt = "…";
export const commit = "…";

export const BUILD_META = {
  buildId: BUILD_ID,
  builtAt,
  commit,
  version: BUILD_ID,
  buildTime: builtAt
} as const;
```

Assim, o app consegue checar atualizações no ar.

---

## 📁 Arquivos gerados no build

Esses arquivos **não devem ir para o Git**:

```
public/version.json
src/build-meta.ts
```

Adicione ao `.gitignore`:

```
/public/version.json
/src/build-meta.ts
```

Se já estiverem versionados:

```bash
git rm --cached public/version.json src/build-meta.ts
echo -e "/public/version.json\n/src/build-meta.ts" >> .gitignore
git add .gitignore
git commit -m "chore: ignore build meta files"
git push
```

---

## ⚙️ PM2 — dicas rápidas

```bash
# Ver status:
pm2 status

# Logs:
pm2 logs monitor-pxtalk --lines 100

# Reiniciar:
pm2 restart monitor-pxtalk

# Limpar logs:
pm2 flush monitor-pxtalk

# Salvar processos para iniciar com o SO:
pm2 save
pm2 startup   # uma vez
```

---

## 🧯 Resolução de problemas

**“requestFullscreen só pode ser iniciado por gesto do usuário”**  
Normal. Ignore se a UX estiver ok.

**Versão não aparece/checa**  
- Verifique se `prebuild` está rodando.  
- Confirme que `version.json` está sendo servido.  
- Adicione `?ts=\${Date.now()}` na URL para evitar cache.

**Vite/esbuild vulnerável**  
Atualize o Vite:

```bash
npm i -D vite@^7
npm audit
```

**Deploy não reinicia**  
Verifique `deploy.sh` e o nome do app no PM2 (`monitor-pxtalk`).  
Use `pm2 logs` para verificar erros.

---