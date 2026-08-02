# 3D Colab Recommendations

Marketplace 3D **lite** derivado do [3D Colab](https://github.com/ilaraca/3d-colab), focado em demonstrar um **sistema de recomendação** (content-based + rede neural) para a pós-graduação — com laboratório interativo para aprender o pipeline de ML na prática.

> Pipeline: **contexto → encode (produto/usuário) → dataset → treino → inferência → ranking**

---

## Índice

1. [Sobre o projeto](#sobre-o-projeto)
2. [Funcionalidades](#funcionalidades)
3. [Stack tecnológica](#stack-tecnológica)
4. [Setup e instalação](#setup-e-instalação)
5. [Docker](#docker)
6. [Demo ao vivo](#demo-ao-vivo)
7. [Páginas e rotas](#páginas-e-rotas)
8. [Referência da API](#referência-da-api)
9. [Sistema de recomendação](#sistema-de-recomendação)
10. [Laboratório interativo (`/learn`)](#laboratório-interativo-learn)
11. [Banco de dados](#banco-de-dados)
12. [Arquitetura e estrutura de código](#arquitetura-e-estrutura-de-código)
13. [Testes e CI](#testes-e-ci)
14. [Git Flow e versionamento](#git-flow-e-versionamento)
15. [Deploy em produção](#deploy-em-produção)
16. [Troubleshooting](#troubleshooting)
17. [Documentação adicional](#documentação-adicional)
18. [Licença](#licença)

---

## Sobre o projeto

### O problema

Um marketplace de produtos 3D lista dezenas de itens. Sem personalização, todo usuário vê a **mesma ordem** — mais recentes, mais baratos, ordem alfabética. Quem gosta de vasos decorativos e quem procura peças funcionais recebem exatamente a mesma vitrine.

### A solução

Este repositório demonstra **formas crescentes de personalizar** essa vitrine, usando histórico de compras e atributos dos produtos (categoria, material, preço, dimensões, etc.).

### Duplo objetivo

| Objetivo | Descrição |
|----------|-----------|
| **Produto** | Marketplace 3D funcional com recomendações personalizadas |
| **Educacional** | Laboratório interativo que **expõe o processo** — vetores, dataset, treino, métricas — numa interface visual em `/learn` |

### Público-alvo

- Estudantes de pós-graduação aprendendo sistemas de recomendação
- Desenvolvedores que querem entender ML aplicado sem abstrações mágicas
- Apresentações e demos ao vivo (personas com comportamentos distintos)

### O que foi removido (vs 3D Colab completo)

Pagamentos (Mercado Pago), chat, escrow, upload de produtos, doações, admin e demais complexidades de produção.

---

## Funcionalidades

| Área | Descrição |
|------|-----------|
| **Marketplace** | Catálogo com busca textual, filtro por categoria, paginação e ordenação |
| **Recomendações Fase 1** | Content-based por similaridade de cosseno |
| **Recomendações Fase 2** | Rede neural TF.js com fallback automático |
| **Toggle de algoritmo** | Auto / Content / ML / Ambos no marketplace (usuário logado) |
| **Produtos similares** | Content-based na página de detalhe do produto |
| **Preview 3D** | Visualização interativa de STL (Three.js) com pré-carregamento e feedback de loading |
| **Docker** | Stack completa containerizada: app + PostgreSQL + pgAdmin |
| **Laboratório `/learn`** | 20 lições, treino no browser, quiz, missões guiadas |
| **Auth demo** | NextAuth (Credentials + JWT) com logins fixos |
| **Seed completo** | 20 produtos, 4 makers, históricos distintos |
| **CI/CD** | GitHub Actions: lint, testes, build + Git Flow automatizado |
| **Versionamento** | Semver automático via Conventional Commits |

---

## Stack tecnológica

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 14 (App Router) |
| UI | React 18, Tailwind CSS, Radix UI, shadcn/ui, next-themes |
| Auth | NextAuth 4 (Credentials + JWT, sessão 30 dias) |
| ORM / DB | Prisma 5 + PostgreSQL 16 |
| ML | `@tensorflow/tfjs` 4.x (pure JS; `@tensorflow/tfjs-node` opcional no CLI) |
| 3D | Three.js + three-stdlib (dynamic import, lazy load) |
| Imagens | `next/image` + **sharp** (otimização em produção/Docker) |
| Testes | Jest 29 + Testing Library |
| CI | GitHub Actions (Node 20) |
| Container | Docker Compose — app Next.js standalone + PostgreSQL 16 + pgAdmin |

---

## Setup e instalação

### Qual branch clonar

Use a branch **`develop`** — é onde está a versão atual (marketplace + laboratório ML).  
A `main` só recebe releases estáveis e pode estar atrás.

```bash
git clone https://github.com/ilaraca/3d-colab-recommendations.git
cd 3d-colab-recommendations
git checkout develop
```

### Pré-requisitos

- **Opção A (Docker):** Docker e Docker Compose
- **Opção B (local):** Node.js 20+, Docker (só para Postgres) ou PostgreSQL externo
- Git

### Opção A — Tudo em Docker (recomendado)

Sobe **app Next.js + PostgreSQL + pgAdmin** em containers. Detalhes completos na seção [Docker](#docker).

```bash
git clone https://github.com/ilaraca/3d-colab-recommendations.git
cd 3d-colab-recommendations
cp .env.example .env

# Primeira vez (reset se Postgres falhar com volume antigo)
npm run docker:reset   # opcional — limpa volumes
npm run docker:setup   # sobe db → migrate + seed
npm run docker:up      # build + sobe app (+ pgAdmin)
```

Acesse: **http://localhost:3000**

| Serviço | URL |
|---------|-----|
| App | http://localhost:3000 |
| pgAdmin | http://localhost:5050 |

| Comando | Descrição |
|---------|-----------|
| `npm run docker:up` | Build + sobe app e dependências |
| `npm run docker:down` | Para todos os containers |
| `npm run docker:setup` | Aguarda Postgres saudável → migrate + seed |
| `npm run docker:reset` | Remove volumes (banco + modelos ML) |
| `npm run docker:logs` | Logs da app em tempo real |

> O volume `ml_models` persiste modelos ML treinados/uploadados em `models/recommendations/`.

### Opção B — Desenvolvimento local

App no host, Postgres no Docker.

```bash
git clone https://github.com/ilaraca/3d-colab-recommendations.git
cd 3d-colab-recommendations
cp .env.example .env

# Subir apenas PostgreSQL (+ pgAdmin em http://localhost:5050)
docker compose up -d db pgadmin

# Instalar dependências e configurar banco
npm install
npm run db:setup   # prisma migrate dev + seed

# (Opcional) Treinar modelo ML para Fase 2
npm run recommendations:train

# Rodar em desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000** (redireciona para `/marketplace`)

### Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (hot reload) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção (após build) |
| `npm run lint` | ESLint (Next.js) |
| `npm run db:setup` | `prisma migrate dev` + seed |
| `npm run migrate` | Apenas migrations Prisma |
| `npm run seed` | Popular banco com dados demo |
| `npm run recommendations:train` | Treinar modelo ML via CLI |
| `npm run assets:stl` | Regenerar STLs de exemplo |
| `npm run test` | Todos os testes Jest |
| `npm run test:unit` | Apenas testes unitários |
| `npm run feature:new <nome>` | Criar branch `feature/*` a partir de `develop` |
| `npm run semver:calc` | Calcular próxima versão (Conventional Commits) |
| `npm run studio` | Prisma Studio (GUI do banco) |
| `npm run docker:up` | Build + sobe stack Docker completa |
| `npm run docker:down` | Para containers Docker |
| `npm run docker:setup` | Migrate + seed via Docker (primeira vez) |
| `npm run docker:reset` | Remove volumes Docker (reset banco + modelos) |
| `npm run docker:logs` | Logs da app no Docker |

### Variáveis de ambiente

Copie `.env.example` para `.env`:

```bash
# Database
POSTGRES_USER=rec_user
POSTGRES_PASSWORD=rec_pass
POSTGRES_DB=rec_db

# Local (npm run dev) — Postgres em localhost:5432
DATABASE_URL="postgresql://rec_user:rec_pass@localhost:5432/rec_db"

# Docker (serviço app) — sobrescrito no docker-compose.yaml:
# postgresql://rec_user:rec_pass@db:5432/rec_db

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me-in-production-use-openssl-rand-base64-32

# Docker (opcional)
# APP_PORT=3000
```

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim (local) | Connection string — use `localhost` no host, `db` no Docker |
| `NEXTAUTH_URL` | Sim | URL pública da app (sem barra final) |
| `NEXTAUTH_SECRET` | Sim | Segredo JWT — gere com `openssl rand -base64 32` |
| `POSTGRES_*` | Docker | Credenciais Postgres (defaults no compose) |
| `APP_PORT` | Não | Porta da app no host (default: `3000`) |
| `PGADMIN_EMAIL` / `PGADMIN_PASSWORD` | Não | pgAdmin (default: `admin@admin.com` / `admin`) |

> Variáveis de produção planejadas (`LEARN_UPLOAD_ENABLED`, etc.): ver [`docs/deployment/spec.md`](./docs/deployment/spec.md).  
> Em deploy público, troque `NEXTAUTH_SECRET` e trate `POST /api/learn/upload-model` como endpoint sensível (sem autenticação no lab local).

---

## Docker

Stack containerizada para rodar **toda a aplicação** sem instalar Node.js localmente — ideal para demo, apresentações e deploy em VPS.

### Serviços

| Serviço | Imagem / Build | Porta | Função |
|---------|----------------|-------|--------|
| `app` | `Dockerfile` (multi-stage) | 3000 | Next.js 14 standalone |
| `db` | `postgres:16-alpine` | 5432 | PostgreSQL |
| `pgadmin` | `dpage/pgadmin4` | 5050 | GUI do banco (opcional) |
| `setup` | `Dockerfile` (target: builder) | — | Migrate + seed (profile `setup`, one-shot) |

### Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│  Host (localhost)                                       │
│                                                         │
│  :3000 ──► app (Next.js standalone)                     │
│              │                                          │
│              ├──► db:5432 (PostgreSQL)                  │
│              └──► volume ml_models                       │
│                   └── models/recommendations/           │
│                                                         │
│  :5050 ──► pgadmin ──► db                               │
│  :5432 ──► db (acesso direto / Prisma Studio local)   │
└─────────────────────────────────────────────────────────┘
```

### Dockerfile (multi-stage)

| Stage | Função |
|-------|--------|
| `deps` | `npm ci --ignore-scripts` + `npm rebuild sharp` |
| `builder` | `prisma generate` + `next build` (output: standalone) |
| `runner` | Imagem mínima: `server.js`, static, Prisma, **sharp**, modelos ML |

**Destaques da imagem `app`:**

- Next.js `output: 'standalone'` — bundle enxuto para produção
- **sharp** + `@img/*` copiados para otimização de imagens (`next/image`)
- `docker/entrypoint.sh` — roda `prisma migrate deploy` antes de iniciar
- Volume `ml_models` — persiste upload de modelos do laboratório `/learn`
- Usuário non-root (`nextjs`) por segurança

### Fluxo de setup (`docker/setup.sh`)

O script `npm run docker:setup` executa:

1. `docker compose up -d db` — sobe Postgres
2. Aguarda healthcheck (`pg_isready`, até 60s)
3. Se falhar → exibe logs e sugere `docker:reset`
4. `docker compose --profile setup run --rm setup` — migrate + seed

### Volumes

| Volume | Conteúdo | Reset |
|--------|----------|-------|
| `postgres_data` | Dados PostgreSQL | `npm run docker:reset` |
| `pgadmin_data` | Config pgAdmin | `npm run docker:reset` |
| `ml_models` | Modelos ML (`model.json`, `weights.bin`) | `npm run docker:reset` |

### Treino ML no Docker

| Método | Como |
|--------|------|
| **Laboratório `/learn`** | Treinar no browser → **Aplicar no marketplace** (persiste no volume) |
| **CLI no host** | `npm run recommendations:train` com `DATABASE_URL` apontando para `localhost:5432` |

> O aviso `Hi, looks like you are running TensorFlow.js in Node.js` nos logs é informativo — não impede o funcionamento. Para treino CLI mais rápido, use `@tensorflow/tfjs-node` localmente.

### Preview 3D no Docker

- STLs servidos de `public/models/` (incluídos na imagem)
- Three.js carregado via **dynamic import** (não bloqueia a página)
- Pré-carregamento ao abrir produto com STL
- Spinner de loading enquanto baixa/parseia o arquivo

---

## Demo ao vivo

### Logins fixos

Senha para **todos** os usuários: `demo123`

| Email | Papel | Comportamento das recomendações |
|-------|-------|--------------------------------|
| `maria@demo.com` | Compradora | Decorativos / PLA (5 compras) |
| `joao@demo.com` | Comprador | Funcionais / ABS / TPU (5 compras) |
| `maker1@demo.com` | Vendedor | Sem histórico de compra → populares |
| `maker2@demo.com` … `maker4@demo.com` | Vendedores | Apenas perfil de maker |

### Histórico de compras (seed)

**Maria** comprou: Vaso Geométrico, Escultura Abstrata, Porta-retrato 3D, Vaso Suculenta, Estátua Gato.

**João** comprou: Organizador de Mesa, Suporte de Headphone, Clip de Cabo USB, Engrenagem Educacional, Suporte Tablet.

### Fluxo de demo sugerido (~10 min)

1. Abrir `/marketplace` **sem login** → seção **"Mais populares"**
2. Login como **Maria** → carrossel muda para itens decorativos/PLA
3. Usar toggle **Auto / Content / ML / Ambos** para comparar algoritmos
4. Logout → login como **João** → recomendações diferentes (funcionais/ABS)
5. Abrir um produto com STL → **Preview 3D** + **Produtos similares**
6. Abrir `/learn` → aba **Vetores** → comparar perfis Maria vs João
7. Aba **Treino TF** → treinar rede no browser → **Aplicar no marketplace**
8. Voltar ao marketplace com toggle **ML** → ver efeito do modelo treinado

---

## Páginas e rotas

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/` | Server | Redireciona para `/marketplace` |
| `/marketplace` | Client | Catálogo + busca/filtros + seção de recomendações |
| `/products/[id]` | Client | Detalhe, specs 3D, preview STL, produtos similares |
| `/learn` | Server | Laboratório interativo de ML |
| `/about` | Server | Sobre o projeto e links rápidos |
| `/auth/signin` | Client | Login via Credentials (NextAuth) |

---

## Referência da API

Todas as rotas são **dinâmicas** (`force-dynamic`) — não há cache estático.

### `GET /api/marketplace`

Listagem paginada de produtos disponíveis.

| Parâmetro | Default | Descrição |
|-----------|---------|-----------|
| `search` | — | Busca em título e descrição (case-insensitive) |
| `category` | — | Filtro por categoria (`decorative`, `functional`, etc.) |
| `sortBy` | `created_at` | Campo de ordenação |
| `sortOrder` | `desc` | `asc` ou `desc` |
| `page` | `1` | Página atual |
| `limit` | `12` | Itens por página |

**Resposta:**

```json
{
  "items": [{ "id": 1, "title": "...", "price": 45, "user": {}, "images": [], "stl_file": {} }],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalCount": 20,
    "hasNextPage": true,
    "hasPrevPage": false,
    "limit": 12
  }
}
```

### `GET /api/products/[id]`

Detalhe completo do produto (specs, imagens, STL, maker, reviews).

### `GET /api/recommendations`

Motor principal de recomendações. Usa sessão NextAuth para identificar o usuário.

| Parâmetro | Default | Descrição |
|-----------|---------|-----------|
| `source` | `auto` | `auto` · `ml` · `content` |
| `mode` | auto | `personalized` · `similar` · `popular` |
| `productId` | — | Obrigatório quando `mode=similar` |
| `limit` | `12` | Máximo 50 |
| `excludeIds` | — | IDs separados por vírgula |

**Lógica de decisão:**

```
Usuário logado?
├── Não → popular (ordena por nº de vendas)
└── Sim → tem histórico de compras?
    ├── Não → popular
    └── Sim → source?
        ├── content → Fase 1 (cosseno)
        ├── ml → Fase 2 (503 se modelo ausente)
        └── auto → ML se modelo existe, senão Fase 1
```

**Resposta:**

```json
{
  "items": [{ "id": 1, "title": "...", "score": 0.87, "category": "decorative", "images": [] }],
  "meta": {
    "mode": "personalized",
    "source": "ml",
    "modelVersion": "browser-2026-08-02T...",
    "totalCandidates": 20,
    "generatedAt": "2026-08-02T21:00:00.000Z"
  }
}
```

**Exemplos:**

```bash
# Personalizado (auto: ML com fallback content)
GET /api/recommendations

# Forçar content-based
GET /api/recommendations?source=content

# Forçar ML (503 se modelo ausente)
GET /api/recommendations?source=ml

# Produtos similares a um item
GET /api/recommendations?mode=similar&productId=1

# Populares (sem login)
GET /api/recommendations?mode=popular
```

### APIs do laboratório (`/api/learn/*`)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/learn/dataset` | GET | Dataset completo: stats, train/val split, feature labels |
| `/api/learn/vectors?email=` | GET | Vetores de usuário e produtos demo |
| `/api/learn/training-pairs` | GET | Pares positivos/negativos para tabela didática |
| `/api/learn/demo-users` | GET | Personas Maria e João |
| `/api/learn/method-traces` | GET | 20 lições passo a passo do pipeline |
| `/api/learn/recommendations?email=&source=` | GET | Recomendações para o comparador (só emails demo) |
| `/api/learn/model-status` | GET | Modelo ML persistido (`exists`, `metadata`) |
| `/api/learn/upload-model` | POST | Aplica modelo treinado no browser |

**Upload de modelo (POST):**

```json
{
  "modelTopology": {},
  "weightSpecs": [],
  "weightDataBase64": "...",
  "trainExamples": 20,
  "valExamples": 20,
  "finalTrainLoss": 0.56,
  "finalValLoss": 0.67,
  "finalValAccuracy": 0.75,
  "inputDimension": 32,
  "epochsRun": 12
}
```

Salva em `models/recommendations/` (`model.json`, `weights.bin`, `metadata.json`).

> **Nota:** upload público em dev; proteção por ambiente planejada em [`docs/deployment/spec.md`](./docs/deployment/spec.md).

---

## Sistema de recomendação

### Status das fases

| Fase | Abordagem | Status | Docs |
|------|-----------|--------|------|
| **1** | Content-based (cosseno) | ✅ Implementada | [Plano](./docs/recommendations/phase-01-content-based/plan.md) · [Spec](./docs/recommendations/phase-01-content-based/spec.md) |
| **2** | Rede neural (TF.js) | ✅ Implementada | [Plano](./docs/recommendations/phase-02-neural-network/plan.md) · [Spec](./docs/recommendations/phase-02-neural-network/spec.md) |
| **3** | Embeddings / two-tower | 📋 Planejada | [Plano](./docs/recommendations/phase-03-advanced/plan.md) · [Spec](./docs/recommendations/phase-03-advanced/spec.md) |

### Fase 1 — Content-based

**Ideia:** transforme produto e usuário em vetores numéricos; recomende os mais similares (cosseno).

**Pipeline:**

```
Produtos disponíveis → buildContext (min/max, índices)
                    → encodeProduct / encodeUserFromPurchases
                    → cosineSimilarity
                    → ranking (exclui comprados e produtos próprios)
```

**Vetor de produto** (16 dimensões com dataset demo):

```
[price, avgRating, printTime, volume, weight, ...category one-hot, ...material one-hot]
 └──── 5 numéricos normalizados ────┘ └─ 6 categorias ─┘ └── 5 materiais ──┘
```

**Pesos das features:**

| Feature | Peso | Tipo |
|---------|------|------|
| Categoria | 0.35 | one-hot ponderado |
| Material | 0.25 | one-hot ponderado |
| Preço | 0.15 | normalizado min-max |
| Avaliação média | 0.10 | normalizado 0–5 |
| Tempo de impressão | 0.05 | normalizado min-max |
| Volume (w×h×d) | 0.05 | normalizado min-max |
| Peso | 0.05 | normalizado min-max |

**Perfil do usuário:** média dos vetores dos produtos comprados (pedidos com status `completed`, `delivered` ou `shipped`).

**Cold start:** sem histórico → modo popular (ordena por número de vendas).

### Fase 2 — Rede neural

**Ideia:** classificação binária — par `(usuário, produto)` → probabilidade de compra (0–1).

**Arquitetura** (`model.ts`):

```
Input (inputDim = dimensions × 2, ex: 32)
  → Dense(64, relu) + L2(0.01)
  → Dropout(0.2)
  → Dense(32, relu)
  → Dense(1, sigmoid)
```

| Hiperparâmetro | Valor |
|----------------|-------|
| Otimizador | Adam (lr 0.01) |
| Loss | binaryCrossentropy |
| Batch size | 32 |
| Épocas máx | 50 |
| Early stopping | patience 5 (val_loss) |

**Dataset:**

- Input: `[vetor_usuário, vetor_produto]` concatenados
- Label: `1` (comprou) / `0` (não comprou)
- **Leave-one-out:** ao montar perfil do usuário para um par, exclui o produto sendo rotulado (evita data leakage)
- **Split:** 80/20 por usuário (`splitByUser`, seed 42)

**Treino via CLI:**

```bash
npm run recommendations:train
# ou com backend nativo (mais rápido):
TFJS_USE_NODE=1 npm run recommendations:train
```

**Artefatos gerados:**

```
models/recommendations/
├── model.json      # topologia
├── weights.bin     # pesos
└── metadata.json   # versão, métricas, inputDim
```

**Treino no browser:** aba **Treino TF** em `/learn` → gráfico loss/val_loss → **Aplicar no marketplace**.

### Dataset demo

| Item | Quantidade |
|------|-----------|
| Produtos | 20 |
| Makers (vendedores) | 4 |
| Compradores com histórico | 2 (Maria e João) |
| Categorias | 6: decorative, functional, educational, figure, prototype, part |
| Materiais | 5: PLA, ABS, PETG, TPU, Resina |
| STLs com preview 3D | 7 produtos |
| Pares de treino (2 users × 20 products) | 40 (10 positivos, 30 negativos) |

> Volume propositalmente pequeno para ser didático. O *overfit* visível no laboratório é um recurso pedagógico, não um defeito.

### Categorias do marketplace

| Slug | Label PT |
|------|----------|
| `decorative` | Decorativo |
| `functional` | Funcional |
| `educational` | Educacional |
| `figure` | Figuras |
| `prototype` | Protótipo |
| `part` | Peças |

---

## Laboratório interativo (`/learn`)

Interface educacional que expõe cada etapa do código real do projeto — vetores, dataset, treino, métricas — visualmente.

Acesse: **http://localhost:3000/learn**

### Abas

| Aba | Componente | Conteúdo |
|-----|------------|----------|
| **Visão geral** | `ConceptPanel`, `LearningMissions`, `LearnQuiz` | Pipeline 6 fases, trilha, missões, quiz |
| **Passo a passo** | `MethodExplorer`, `PipelineFlowchart` | 20 lições com código, variáveis, outputs |
| **Vetores** | `VectorExplorer`, `FeatureTooltip` | Perfil Maria vs João, pesos, glossário |
| **Treino TF** | `TrainingPlayground`, `Charts` | `model.fit()` no browser, loss/val_loss |
| **Comparar** | `RecommendationComparator` | Content vs ML lado a lado |

### 20 lições do Method Explorer

Organizadas em 6 fases do pipeline:

| Fase | Lições |
|------|--------|
| **Dados** | `buildContext`, `load-source-data` |
| **Representação** | `vector-math`, `encode-product`, `encode-user`, `cold-start-leave-one-out` |
| **Treinamento** | `create-training-data`, `split-by-user`, `create-model`, `train-model`, `training-entry-points` |
| **Persistência** | `export-upload`, `save-load-model` |
| **Inferência** | `predict-batch`, `score-products-ml`, `content-fallback` |
| **Entrega** | `recommend-orchestrator`, `recommendations-api`, `learn-facades`, `ui-consumers` |

Cada lição exibe: código real, variáveis de entrada, fórmula (quando aplicável) e output calculado.

### Missões guiadas (9)

Progresso salvo em `localStorage` (`learn-lab-missions`):

1. Percorrer um método no mapa
2. Explorar vetores de um usuário demo
3. Comparar Maria e João
4. Treinar no browser (`model.fit()`)
5. Comparar Content vs ML
6. Detectar overfit (≥50 épocas, val_loss sobe)
7. Aplicar modelo no marketplace
8. Quiz — aprovar uma trilha (≥70%)
9. Quiz completo — aprovar as 4 trilhas

### Quiz (4 trilhas)

| Trilha | Foco | Aprovação |
|--------|------|-----------|
| Analogias | Conceitos sem jargão | ≥70% |
| Vocabulário | Termos do laboratório | ≥70% |
| Métodos — Content | context, encode, similarity | ≥70% |
| Métodos — ML | dataset, treino, inferência | ≥70% |

Progresso salvo em `localStorage` (`learn-lab-quiz`). Opções embaralhadas por sessão.

### Glossário integrado

Tooltips em termos como: épocas, learning rate, dropout, cosseno, leave-one-out, val_loss, sigmoid, binary crossentropy, etc. — definidos em `lab-concepts.ts`.

---

## Banco de dados

### Schema Prisma

```
user ──┬── product (como maker/vendedor)
       └── order ── orderItem ── product

product ──┬── image
          ├── stl_file (1:1)
          └── review
```

| Model | Campos principais |
|-------|-------------------|
| `user` | name, email, password (bcrypt), avatar_url |
| `product` | title, category, material, price, width/height/depth, weight, print_time |
| `order` | order_number, status (`completed` por default) |
| `orderItem` | product_id, quantity |
| `review` | rating (1–5) |
| `stl_file` | url, filename |
| `image` | url |

### Comandos úteis

```bash
npm run db:setup          # migrate + seed (desenvolvimento)
npx prisma migrate deploy # migrate em produção
npm run seed              # repopular dados demo
npm run studio            # GUI visual do banco
```

### pgAdmin (opcional)

Após `docker compose up -d`:

- URL: http://localhost:5050
- Login: `admin@admin.com` / `admin` (ou valores de `PGADMIN_*`)
- Host do servidor: `db`, porta `5432`, credenciais de `POSTGRES_*`

---

## Arquitetura e estrutura de código

### Diagrama de camadas

```mermaid
flowchart TB
    subgraph UI["Interface"]
        MP["/marketplace"]
        PD["/products/id"]
        LB["/learn"]
    end

    subgraph API["API Routes"]
        AR["/api/recommendations"]
        AL["/api/learn/*"]
    end

    subgraph CORE["lib/recommendations"]
        CTX["context.ts"]
        ENC["encode.ts"]
        SIM["similarity.ts"]
        TD["training-data.ts"]
        MDL["model.ts"]
        REC["recommend.ts"]
    end

    subgraph DATA["Persistência"]
        PG[("PostgreSQL")]
        FS["models/recommendations/"]
    end

    MP --> AR
    PD --> AR
    LB --> AL
    AR --> REC
    AL --> REC
    REC --> CTX & ENC & SIM & MDL
    MDL --> FS
    CTX & ENC --> PG
```

### Estrutura de diretórios

```
3d-colab-recommendations/
├── Dockerfile               # Multi-stage: app Next.js (standalone)
├── docker-compose.yaml      # app + db + pgadmin + setup profile
├── docker/
│   ├── entrypoint.sh        # migrate deploy + start server
│   └── setup.sh             # aguarda db + migrate + seed
├── .dockerignore
├── .github/workflows/       # CI, Git Flow, releases
├── docs/
│   ├── recommendations/     # Docs completas das fases
│   ├── deployment/          # Spec de deploy (draft)
│   └── GITFLOW.md
├── models/recommendations/  # Artefatos ML (model.json, weights.bin)
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   ├── products/            # Imagens JPG
│   ├── models/              # STLs
│   └── avatars/
├── scripts/
│   ├── calculate-semver.ts
│   ├── new-feature.sh
│   └── setup-branch-protection.sh
├── src/
│   ├── app/                 # Pages + API Routes (App Router)
│   ├── components/
│   │   ├── learn/           # 11 componentes do laboratório
│   │   ├── ui/              # shadcn/ui
│   │   ├── recommendations-section.tsx
│   │   ├── similar-products.tsx
│   │   ├── stl-preview.tsx
│   │   └── three-scene.tsx
│   ├── lib/
│   │   ├── recommendations/ # Core ML (20 módulos)
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   └── constants.ts
│   └── scripts/
│       ├── train-recommendation-model.ts
│       └── generate-sample-stls.ts
└── tests/unit/lib/recommendations/
```

### Módulos principais (`lib/recommendations/`)

| Módulo | Responsabilidade |
|--------|------------------|
| `context.ts` | Estatísticas globais, índices category/material |
| `encode.ts` | Produto e usuário → vetor |
| `similarity.ts` | Cosseno, one-hot, normalize, averageVectors |
| `training-data.ts` | Pares + labels, split, leave-one-out |
| `model.ts` | Arquitetura e treino da rede neural |
| `ml-recommend.ts` | Inferência ML (scoreProductsML) |
| `recommend.ts` | Orquestração auto/content/ml |
| `model-loader.ts` | Persistência (save/load model.json) |
| `browser-model.ts` | Treino no browser |
| `queries.ts` | Queries Prisma |
| `learn-data.ts` | Facades para APIs do laboratório |
| `education-traces.ts` | Lições passo a passo |
| `education-pipeline-lessons.ts` | 16 lições ilustradas |
| `quiz-questions.ts` | 4 trilhas de quiz |
| `lab-concepts.ts` | Glossário e conceitos |
| `feature-descriptions.ts` | Descrições das features para UI |
| `constants.ts` | Pesos, limites, tipos |
| `types.ts` | Interfaces TypeScript |
| `tensorflow.ts` | Loader TF.js (browser vs node) |

---

## Testes e CI

### Rodar testes

```bash
npm run test:unit    # apenas unitários
npm run test         # todos
npm run lint         # ESLint
npm run build        # build de produção
```

### Cobertura unitária

| Arquivo | O que testa |
|---------|-------------|
| `encode.test.ts` | Vetorização produto/usuário, cold start |
| `similarity.test.ts` | Cosseno, one-hot, normalize |
| `training-data.test.ts` | Pares, split por usuário, leave-one-out |
| `model.test.ts` | Arquitetura, treino, early stopping |
| `quiz-questions.test.ts` | Trilhas, threshold 70%, embaralhamento |

### CI (`ci.yml`)

Roda em todo PR para `main`, `develop`, `feature/*`, `release/*`, `hotfix/*`:

1. `npm ci`
2. `npm run lint`
3. `npm run test:unit`
4. `npm run build`

Push direto em `develop` e `release/*` também dispara CI.

---

## Git Flow e versionamento

Branches: `main` (produção) · `develop` (integração) · `feature/*` · `release/*` · `hotfix/*`

### Para colaboradores

```bash
# Criar feature a partir de develop
npm run feature:new minha-feature

git commit -m "feat(learn): adiciona painel de vetores"
git push -u origin feature/minha-feature
# → Auto Pull Request abre PR para develop
```

**Regra:** features sempre a partir de `develop`, nunca de `main`.

### Fluxo de release (automático)

```
feature/* ──push──► Auto PR ──► develop
                                    │
develop ──push──► Auto Release Sync (calcula semver)
                                    │
                                    ▼
                          PR develop → release/X.Y.Z
                                    │
                          merge ────► release/*
                                    │
                          Auto Release PR ──► main
                                    │
                          merge (@ilaraca) ──► tag vX.Y.Z + GitHub Release
```

### Versionamento semântico

Calculado automaticamente pelos commits convencionais desde a **última tag em `main`**:

| Commit | Bump | Exemplo |
|--------|------|---------|
| `feat:` | MINOR | `1.0.0` → `1.1.0` |
| `fix:`, `perf:` | PATCH | `1.0.0` → `1.0.1` |
| `BREAKING CHANGE` / `feat!:` | MAJOR | `1.0.0` → `2.0.0` |
| `chore:`, `docs:`, `ci:` | — | não abre release |

Testar localmente:

```bash
npm run semver:calc
# {"currentVersion":"1.0.0","nextVersion":"1.1.0","bump":"minor",...}
```

### `package.json` — precisa alterar manualmente?

**Não.** O workflow **Auto Release Sync** atualiza `package.json` automaticamente ao criar a branch `release/X.Y.Z`. A **fonte de verdade** da versão publicada é a **tag Git** (`vX.Y.Z`), não o valor local do `package.json`.

Exceção: em **hotfix** (`hotfix/1.0.1`), inclua o bump do `package.json` no PR do hotfix.

### Workflows GitHub Actions

| Workflow | Trigger | Função |
|----------|---------|--------|
| `ci.yml` | PR / push | Lint, testes, build |
| `gitflow-guard.yml` | PR | Valida origem/destino das branches |
| `auto-pr.yml` | Push `feature/**` | Abre PR → `develop` |
| `auto-release-sync.yml` | Push `develop` | Calcula semver + PR → `release/*` |
| `auto-release-pr.yml` | Push `release/**` / `hotfix/**` | Abre PR → `main` |
| `release.yml` | Merge em `main` | Tag + GitHub Release |
| `start-release.yml` | Manual | Atalho → dispara Auto Release Sync |

### Proteção de branches

```bash
chmod +x scripts/setup-branch-protection.sh
./scripts/setup-branch-protection.sh
```

Guia completo: [`docs/GITFLOW.md`](./docs/GITFLOW.md)

---

## Deploy em produção

> Spec completa (draft): [`docs/deployment/spec.md`](./docs/deployment/spec.md)

### Stack recomendada

| Cenário | Stack |
|---------|-------|
| **Demo / VPS / persistência ML** | **Docker** (este repo) — volume `ml_models` |
| **Serverless rápido** | Vercel + PostgreSQL (Neon) + NextAuth |

### Docker em produção (VPS)

```bash
cp .env.example .env
# Edite NEXTAUTH_SECRET e NEXTAUTH_URL com domínio real

npm run docker:setup
npm run docker:up
```

Coloque um reverse proxy (nginx/Caddy) na frente da porta 3000 com HTTPS.

### Vercel (alternativa)

1. Criar banco PostgreSQL (Neon recomendado)
2. Configurar variáveis na Vercel: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
3. Rodar migrations: `npx prisma migrate deploy`
4. (Opcional) Seed: `npm run seed`
5. Deploy via import do repositório GitHub

### Limitação importante — modelo ML na Vercel

O filesystem serverless da Vercel é **efêmero** — upload pelo laboratório pode funcionar e sumir no próximo cold start.

| Estratégia | Quando usar |
|------------|-------------|
| Content-only em prod | Demo rápida sem ML |
| Treinar no CI e commitar artefato | MVP com ML fixo |
| VPS (Railway/Fly/Docker) | Upload persistente do lab |
| Blob/S3 (futuro) | Produção real |

### Gerar `NEXTAUTH_SECRET` seguro

```bash
openssl rand -base64 32
```

Nunca use o placeholder do `.env.example` em produção.

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `Can't reach database` | Verifique `docker compose up -d db` e `DATABASE_URL` |
| Postgres `exited (1)` no Docker | Volume incompatível — `npm run docker:reset` → `npm run docker:setup` |
| Erro `sharp missing in production` | Rebuild: `docker compose up -d --build app` (sharp incluído no Dockerfile) |
| Recomendações ML retornam 503 | Treine no `/learn` ou `npm run recommendations:train` (host → `localhost:5432`) |
| Login não funciona | Confira `NEXTAUTH_URL` e `NEXTAUTH_SECRET` no `.env` |
| Preview 3D lento na 1ª vez | Normal — carrega bundle Three.js + STL; spinner indica progresso |
| Preview STL não carrega | Produto precisa ter `stl_file` no seed (7 produtos) |
| Seed falha | Postgres não saudável — veja `docker compose logs db` |
| Overfit no lab | Esperado com dataset pequeno — recurso pedagógico |
| `npm run recommendations:train` lento | Use `TFJS_USE_NODE=1` com `@tensorflow/tfjs-node` instalado |
| CI falha no build | Rode `npm run lint && npm run test:unit && npm run build` localmente |
| Feature PR bloqueado | Branch deve ser criada a partir de `develop`, não `main` |

### Reset completo (Docker)

```bash
npm run docker:reset    # remove volumes
npm run docker:setup    # migrate + seed
npm run docker:up       # sobe app
```

### Reset completo (dev local)

```bash
docker compose down -v
docker compose up -d db pgadmin
npm run db:setup
npm run recommendations:train
```

---

## Documentação adicional

| Documento | Conteúdo |
|-----------|----------|
| [`CHANGELOG.md`](./CHANGELOG.md) | Histórico de mudanças (Keep a Changelog) |
| [`docs/recommendations/README.md`](./docs/recommendations/README.md) | Documentação completa do sistema de recomendação (970 linhas, fluxogramas) |
| [`docs/recommendations/OVERVIEW.md`](./docs/recommendations/OVERVIEW.md) | Overview técnico e mapeamento de features |
| [`docs/GITFLOW.md`](./docs/GITFLOW.md) | Git Flow, workflows, commits semânticos |
| [`docs/deployment/spec.md`](./docs/deployment/spec.md) | Spec de deploy e proteção do upload (draft) |
| [`docs/recommendations/phase-01-content-based/`](./docs/recommendations/phase-01-content-based/) | Plano e spec Fase 1 |
| [`docs/recommendations/phase-02-neural-network/`](./docs/recommendations/phase-02-neural-network/) | Plano e spec Fase 2 |
| [`docs/recommendations/phase-03-advanced/`](./docs/recommendations/phase-03-advanced/) | Plano e spec Fase 3 (planejada) |

---

## Licença

MIT — derivado do projeto [3D Colab](https://github.com/ilaraca/3d-colab).
