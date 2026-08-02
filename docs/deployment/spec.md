# Spec — Production Readiness: proteção do upload + deploy

> **SDD (Spec-Driven Development)** — especificação antes da implementação.  
> Escopo: tornar o projeto seguro para deploy público e documentar o caminho **Vercel + PostgreSQL + NextAuth**.

| Campo | Valor |
|-------|-------|
| Status | Draft |
| Prioridade | Alta (pré-deploy) |
| Dependências | Fase 2 ML, laboratório `/learn`, NextAuth, Prisma |
| Fora de escopo | Fase 3, pagamentos, RBAC completo, CDN de STLs |

---

## 1. Contexto e problema

### Situação atual

| Área | Estado |
|------|--------|
| `POST /api/learn/upload-model` | Público — qualquer cliente pode sobrescrever `models/recommendations/` |
| Auth | NextAuth (Credentials + JWT) já usado no marketplace |
| Modelo ML | Gravado em disco local (`models/recommendations/`) |
| Deploy | Documentado apenas para Docker Compose local |

### Riscos

1. **Abuso de upload** — payload malicioso ou substituição do modelo em produção.
2. **Deploy incorreto** — `NEXTAUTH_SECRET` padrão ou `NEXTAUTH_URL` errado quebra login.
3. **Filesystem efêmero (Vercel)** — escrita em `models/recommendations/` não persiste entre invocações serverless; upload pelo lab pode “funcionar” e sumir no próximo cold start.

### Objetivo

Permitir demo ao vivo **local** com fricção mínima e deploy **público** com controles mínimos viáveis, documentando limitações da plataforma.

---

## 2. Objetivos e não-objetivos

### Objetivos

- [ ] Proteger `POST /api/learn/upload-model` com regras explícitas por ambiente.
- [ ] Manter o fluxo “Aplicar no marketplace” funcional para usuários autorizados no lab.
- [ ] Publicar guia de deploy: **Vercel + PostgreSQL (Neon recomendado) + NextAuth**.
- [ ] Atualizar `.env.example` e README com variáveis e passos de produção.

### Não-objetivos (nesta entrega)

- Storage externo de modelo (S3/Blob) — documentar como evolução.
- Rate limiting / WAF — backlog.
- OAuth providers (Google, GitHub).
- CI de deploy automático (apenas documentação manual).

---

## 3. Requisitos funcionais

### RF-01 — Gate de upload por ambiente

| ID | Requisito |
|----|-----------|
| RF-01.1 | Em **produção** (`NODE_ENV=production`), upload exige **sessão NextAuth válida**. |
| RF-01.2 | Em produção, apenas e-mails na allowlist podem fazer upload (default: personas demo). |
| RF-01.3 | Em **desenvolvimento**, upload permanece permitido **sem login** (DX do laboratório). |
| RF-01.4 | Flag `LEARN_UPLOAD_ENABLED=false` desabilita upload em qualquer ambiente → **403**. |
| RF-01.5 | Respostas de erro padronizadas (ver seção 5). |

### RF-02 — UI alinhada à API

| ID | Requisito |
|----|-----------|
| RF-02.1 | Botão “Aplicar no marketplace” em `/learn` deve orientar login quando API retornar **401**. |
| RF-02.2 | Mensagem clara quando upload estiver desabilitado (**403**). |
| RF-02.3 | `fetch` do client envia cookies de sessão (`credentials: 'include'`). |

### RF-03 — Guia de deploy

| ID | Requisito |
|----|-----------|
| RF-03.1 | Documento passo a passo: criar projeto Vercel, banco Postgres, variáveis, migrate, seed. |
| RF-03.2 | Instruções para gerar `NEXTAUTH_SECRET` seguro. |
| RF-03.3 | Nota sobre persistência de modelo ML na Vercel e alternativas. |
| RF-03.4 | Checklist pós-deploy (smoke test). |

---

## 4. Requisitos não-funcionais

| ID | Requisito |
|----|-----------|
| RNF-01 | Nenhuma credencial real commitada; `.env` continua no `.gitignore`. |
| RNF-02 | Mudanças mínimas — reutilizar `getServerSession` + padrão de `resolveDemoUserId`. |
| RNF-03 | Testes unitários para helper de autorização de upload. |
| RNF-04 | Lint e build CI permanecem verdes. |

---

## 5. Spec técnica — proteção do upload

### 5.1 Variáveis de ambiente (novas)

```bash
# .env.example (adições)

# Laboratório — upload de modelo treinado no browser
LEARN_UPLOAD_ENABLED=true
# Opcional em produção; default = personas demo do seed
LEARN_UPLOAD_ALLOWED_EMAILS=maria@demo.com,joao@demo.com
```

| Variável | Default | Descrição |
|----------|---------|-----------|
| `LEARN_UPLOAD_ENABLED` | `true` | `false` bloqueia upload (403) em todos os ambientes |
| `LEARN_UPLOAD_ALLOWED_EMAILS` | `maria@demo.com,joao@demo.com` | Lista CSV de e-mails autorizados em produção |

> **Recomendação produção:** `LEARN_UPLOAD_ENABLED=true` apenas se o lab for exposto; caso contrário `false` e treinar via CLI.

### 5.2 Helper de autorização

Novo módulo: `src/lib/recommendations/learn-upload-auth.ts`

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export type LearnUploadDenyReason =
  | 'disabled'
  | 'unauthenticated'
  | 'forbidden';

export interface LearnUploadAuthResult {
  allowed: boolean;
  reason?: LearnUploadDenyReason;
  email?: string;
}

function parseAllowedEmails(): string[] {
  const raw =
    process.env.LEARN_UPLOAD_ALLOWED_EMAILS ??
    'maria@demo.com,joao@demo.com';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function assertLearnUploadAllowed(): Promise<LearnUploadAuthResult> {
  if (process.env.LEARN_UPLOAD_ENABLED === 'false') {
    return { allowed: false, reason: 'disabled' };
  }

  // DX local: sem auth obrigatória
  if (process.env.NODE_ENV !== 'production') {
    return { allowed: true };
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return { allowed: false, reason: 'unauthenticated' };
  }

  const allowedEmails = parseAllowedEmails();
  if (!allowedEmails.includes(email)) {
    return { allowed: false, reason: 'forbidden', email };
  }

  return { allowed: true, email };
}
```

### 5.3 Rota `POST /api/learn/upload-model`

Alteração em `src/app/api/learn/upload-model/route.ts`:

```typescript
import { assertLearnUploadAllowed } from '@/lib/recommendations/learn-upload-auth';

export async function POST(request: NextRequest) {
  const auth = await assertLearnUploadAllowed();

  if (!auth.allowed) {
    const status =
      auth.reason === 'unauthenticated' ? 401 :
      auth.reason === 'forbidden' ? 403 :
      403;

    const messages: Record<string, string> = {
      disabled: 'Upload de modelo desabilitado neste ambiente',
      unauthenticated: 'Faça login para aplicar o modelo no marketplace',
      forbidden: 'Seu usuário não tem permissão para aplicar modelos',
    };

    return NextResponse.json(
      { error: messages[auth.reason ?? 'disabled'] },
      { status }
    );
  }

  // ... validação de payload e saveModelFromArtifacts (existente)
}
```

### 5.4 Validação de payload (reforço)

| Regra | Limite | Status |
|-------|--------|--------|
| Campos obrigatórios | `modelTopology`, `weightSpecs`, `weightDataBase64` | 400 |
| Tamanho `weightDataBase64` | ≤ 15 MB (configurável) | 413 |
| `inputDimension` | inteiro > 0 | 400 |

Implementação sugerida:

```typescript
const MAX_WEIGHT_BASE64_CHARS = 15 * 1024 * 1024 * (4 / 3); // ~15 MB binário

if (weightDataBase64.length > MAX_WEIGHT_BASE64_CHARS) {
  return NextResponse.json({ error: 'Model payload too large' }, { status: 413 });
}
```

### 5.5 Client — `browser-model.ts`

```typescript
const response = await fetch('/api/learn/upload-model', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // envia cookie de sessão NextAuth
  body: JSON.stringify({ ... }),
});
```

### 5.6 UI — `training-playground.tsx`

| Cenário | Comportamento |
|---------|---------------|
| 401 | `setError('Faça login (persona demo) para aplicar o modelo.')` + link `/auth/signin` |
| 403 disabled | `setError('Upload desabilitado neste ambiente.')` |
| 403 forbidden | `setError('Apenas personas demo podem aplicar modelos.')` |

### 5.7 Matriz de decisão

| Ambiente | `LEARN_UPLOAD_ENABLED` | Sessão | E-mail | Resultado |
|----------|------------------------|--------|--------|-----------|
| development | true | — | — | ✅ 200 |
| development | false | — | — | ❌ 403 |
| production | false | — | — | ❌ 403 |
| production | true | ausente | — | ❌ 401 |
| production | true | ok | não listado | ❌ 403 |
| production | true | ok | maria/joao | ✅ 200 |

### 5.8 Erros da API

| Status | Condição | Body |
|--------|----------|------|
| 401 | Produção sem sessão | `{ error: "Faça login..." }` |
| 403 | Upload desabilitado ou e-mail não autorizado | `{ error: "..." }` |
| 400 | Payload inválido | `{ error: "Invalid model payload" }` |
| 413 | Modelo grande demais | `{ error: "Model payload too large" }` |
| 500 | Falha ao gravar | `{ error: "Failed to save model" }` |
| 200 | Sucesso | `{ success: true, message, metadata }` |

---

## 6. Spec técnica — deploy (Vercel + Postgres + NextAuth)

### 6.1 Arquitetura alvo

```mermaid
flowchart LR
  User[Usuário] --> Vercel[Vercel Next.js]
  Vercel --> Neon[(PostgreSQL Neon)]
  Vercel --> Auth[NextAuth JWT]
  Vercel --> FS[models/recommendations ephemeral]
```

| Componente | Serviço | Notas |
|------------|---------|-------|
| App | Vercel | Next.js 14 App Router |
| Banco | Neon Postgres (ou Vercel Postgres) | `DATABASE_URL` com SSL |
| Auth | NextAuth Credentials | JWT + `NEXTAUTH_SECRET` |
| Modelo ML | Disco local | **Ephemeral na Vercel** — ver 6.6 |

### 6.2 Pré-requisitos

- Conta [Vercel](https://vercel.com)
- Conta [Neon](https://neon.tech) (ou Postgres gerenciado equivalente)
- Node 20+ local (para migrate/seed)
- Repositório GitHub conectado

### 6.3 Banco de dados (Neon)

1. Criar projeto Neon (região próxima ao deploy Vercel).
2. Copiar connection string **pooled** (recomendado para serverless):

```
postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

3. Definir como `DATABASE_URL` na Vercel (Production + Preview).

**Migrate em produção:**

```bash
# Local, apontando para Neon
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
npm run seed
```

> Seed em produção: aceitável para demo acadêmica; documentar que recria personas demo.

### 6.4 Projeto Vercel

1. **Import** do repositório GitHub.
2. Framework: Next.js (auto-detect).
3. Build command: `npm run build` (default).
4. Install command: `npm ci` (default).

**Variáveis de ambiente (Production):**

| Variável | Exemplo | Obrigatória |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://...?sslmode=require` | Sim |
| `NEXTAUTH_URL` | `https://seu-app.vercel.app` | Sim |
| `NEXTAUTH_SECRET` | ver 6.5 | Sim |
| `LEARN_UPLOAD_ENABLED` | `true` ou `false` | Recomendado |
| `LEARN_UPLOAD_ALLOWED_EMAILS` | `maria@demo.com,joao@demo.com` | Se upload habilitado |
| `NODE_ENV` | `production` (Vercel define) | Automático |

**Preview deployments:** usar `NEXTAUTH_URL` do preview ou variável por ambiente; Neon branch de preview opcional.

### 6.5 `NEXTAUTH_SECRET`

Gerar valor criptograficamente seguro:

```bash
openssl rand -base64 32
```

- **Nunca** usar o placeholder do `.env.example` em produção.
- Rotacionar secret invalida sessões ativas (comportamento esperado).
- `NEXTAUTH_URL` deve ser a URL pública **exata** (com `https://`, sem barra final).

### 6.6 Persistência do modelo ML na Vercel

**Limitação:** filesystem da função serverless é **read-only** exceto `/tmp`, e **não compartilhado** entre instâncias.

| Estratégia | Quando usar | Persiste upload lab? |
|------------|-------------|----------------------|
| A — Content-only em prod | Demo rápida sem ML | N/A |
| B — Treinar no build/CI e commitar artefato | MVP com ML fixo | Não |
| C — `recommendations:train` pós-deploy em VPS | Railway/Fly/Docker | Sim |
| D — Blob/S3 (futuro) | Produção real | Sim |

**Recomendação MVP Vercel:**

1. Deploy com Fase 1 (content) funcionando out-of-the-box.
2. Para ML: rodar `npm run recommendations:train` em ambiente com disco persistente **ou** incluir modelo no deploy via pipeline (artefato de CI).
3. Documentar que “Aplicar no marketplace” na Vercel pode falhar ou não persistir — preferir treino CLI ou desabilitar upload (`LEARN_UPLOAD_ENABLED=false`).

### 6.7 Guia de deploy — passo a passo

Novo arquivo: `docs/deployment/VERCEL.md`

```markdown
# Deploy — Vercel + Neon + NextAuth

## 1. Neon
- Criar database → copiar DATABASE_URL (pooled)

## 2. Vercel
- Import repo → branch main ou develop
- Environment variables (Production):
  - DATABASE_URL
  - NEXTAUTH_URL=https://<app>.vercel.app
  - NEXTAUTH_SECRET=<openssl rand -base64 32>
  - LEARN_UPLOAD_ENABLED=false  # recomendado inicialmente

## 3. Banco
export DATABASE_URL=...
npx prisma migrate deploy
npm run seed

## 4. Deploy
- Push ou Redeploy na Vercel

## 5. Smoke test
- [ ] /marketplace carrega
- [ ] Login maria@demo.com / demo123
- [ ] Recomendações personalizadas
- [ ] /learn abre
- [ ] /api/learn/model-status responde
```

### 6.8 Smoke test pós-deploy

| # | Teste | Esperado |
|---|-------|----------|
| 1 | `GET /marketplace` | 200, produtos listados |
| 2 | Login demo | Sessão criada |
| 3 | `GET /api/recommendations?source=content` | 200, items |
| 4 | `GET /learn` | UI carrega |
| 5 | `POST /api/learn/upload-model` sem auth (prod) | 401 ou 403 |
| 6 | Login + upload (se habilitado) | 200 ou erro de FS documentado |

### 6.9 Atualizações de documentação

| Arquivo | Alteração |
|---------|-----------|
| `README.md` | Seção “Deploy” com link para `docs/deployment/VERCEL.md` |
| `.env.example` | Novas vars `LEARN_UPLOAD_*` |
| `CHANGELOG.md` | Entrada na próxima release |

---

## 7. Estrutura de arquivos (delta)

```
docs/deployment/
├── spec.md              # este documento
└── VERCEL.md            # guia operacional (implementar)

src/lib/recommendations/
└── learn-upload-auth.ts # novo

src/app/api/learn/upload-model/
└── route.ts             # gate + validação tamanho

src/lib/recommendations/
└── browser-model.ts       # credentials: 'include'

src/components/learn/
└── training-playground.tsx  # mensagens 401/403

tests/unit/lib/recommendations/
└── learn-upload-auth.test.ts  # novo
```

---

## 8. Testes

### 8.1 Unitários — `learn-upload-auth.test.ts`

| Caso | Setup | Assert |
|------|-------|--------|
| Dev permite sem sessão | `NODE_ENV=development` | `allowed: true` |
| Prod sem sessão | `NODE_ENV=production`, mock session null | `reason: unauthenticated` |
| Prod e-mail demo | session maria@demo.com | `allowed: true` |
| Prod e-mail outro | session foo@bar.com | `reason: forbidden` |
| Disabled global | `LEARN_UPLOAD_ENABLED=false` | `reason: disabled` |
| Allowlist custom | `LEARN_UPLOAD_ALLOWED_EMAILS=admin@x.com` | admin ok, maria forbidden |

Mock: `getServerSession` via `jest.mock('next-auth')`.

### 8.2 Integração (opcional / backlog)

- Route handler com session mock → status codes corretos.

---

## 9. Critérios de aceite

### Proteção upload

- [ ] `POST /api/learn/upload-model` retorna **401** em produção sem login.
- [ ] Retorna **403** para usuário logado fora da allowlist.
- [ ] Retorna **403** quando `LEARN_UPLOAD_ENABLED=false`.
- [ ] Em `development`, upload funciona sem login (regressão do lab local).
- [ ] Client envia cookies; botão “Aplicar” mostra mensagem útil em 401/403.
- [ ] Testes unitários do helper passam no CI.

### Deploy

- [ ] `docs/deployment/VERCEL.md` publicado e linkado no README.
- [ ] `.env.example` documenta todas as variáveis de produção.
- [ ] Smoke test documentado e executável manualmente.
- [ ] Limitação de filesystem Vercel explicada no guia.

---

## 10. Plano de implementação

| Fase | Entrega | Estimativa |
|------|---------|------------|
| **P1** | `learn-upload-auth.ts` + testes | 1–2 h |
| **P2** | Gate na rota + limite payload + client `credentials` | 1 h |
| **P3** | UX `training-playground` (401/403) | 30 min |
| **P4** | `docs/deployment/VERCEL.md` + README + `.env.example` | 1–2 h |
| **P5** | Validar deploy preview Vercel + smoke test | 1 h |

Ordem sugerida: P1 → P2 → P3 → P4 → P5.

---

## 11. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Upload “funciona” na Vercel mas modelo some | Alto | Documentar; desabilitar upload em prod por default |
| Secret vazado no log | Alto | Nunca logar env; revisar CI |
| Seed em prod sobrescreve dados | Médio | Aviso no guia; script seed idempotente |
| `@tensorflow/tfjs-node` no serverless | Médio | Manter `@tensorflow/tfjs` pure JS (já configurado) |

---

## 12. Checklist de implementação

```
[ ] learn-upload-auth.ts
[ ] learn-upload-auth.test.ts
[ ] route.ts — gate + 413
[ ] browser-model.ts — credentials: 'include'
[ ] training-playground.tsx — erros 401/403 + link login
[ ] .env.example — LEARN_UPLOAD_*
[ ] docs/deployment/VERCEL.md
[ ] README.md — seção Deploy
[ ] CHANGELOG.md — entrada Unreleased
[ ] Smoke test manual documentado
[ ] PR feature/* → develop
```

---

## 13. Referências

- [`docs/recommendations/phase-02-neural-network/spec.md`](../recommendations/phase-02-neural-network/spec.md) — nota Vercel/tfjs-node
- [`src/app/api/learn/upload-model/route.ts`](../../src/app/api/learn/upload-model/route.ts)
- [`src/lib/auth.ts`](../../src/lib/auth.ts)
- [NextAuth — Deployment](https://next-auth.js.org/deployment)
- [Neon — Prisma](https://neon.tech/docs/guides/prisma)
- [Vercel — Environment Variables](https://vercel.com/docs/projects/environment-variables)
