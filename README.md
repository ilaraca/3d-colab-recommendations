# 3D Colab Recommendations

Marketplace 3D **lite** derivado do [3D Colab](https://github.com/ilaraca/3d-colab), focado em demonstrar um **sistema de recomendação** (content-based + rede neural) e um laboratório interativo (`/learn`) para a pós-graduação.

> Pipeline: **contexto → encode → content-based (cosseno) ou ML (TensorFlow.js) → ranking**

## O que tem neste repo

- UI do marketplace 3D Colab (visual familiar)
- Preview 3D de arquivos STL nos produtos
- Recomendação personalizada — Fase 1 (cosseno) e Fase 2 (rede neural)
- Laboratório educacional em `/learn` (vetores, treino no browser, comparação, quiz)
- Logins fixos para demo ao vivo
- Seed com 20 produtos e históricos distintos

## O que foi removido (vs 3D Colab completo)

Pagamentos (Mercado Pago), chat, escrow, upload, doações, admin e demais complexidades de produção.

## Qual branch clonar

Use a branch **`develop`** — é onde está a versão atual (marketplace + laboratório ML).  
A `main` só recebe releases estáveis e pode estar atrás.

```bash
git clone https://github.com/ilaraca/3d-colab-recommendations.git
cd 3d-colab-recommendations
git checkout develop
```

Requisito: **Node.js 20+** (CI usa Node 20).

## Setup rápido

```bash
cp .env.example .env

# Subir PostgreSQL
docker compose up -d

# Instalar e configurar banco
npm install
npx prisma migrate dev
npm run seed

# Rodar
npm run dev
```

Atalho equivalente ao migrate + seed: `npm run db:setup`

Acesse: http://localhost:3000  
Laboratório: http://localhost:3000/learn

> Em deploy público, troque `NEXTAUTH_SECRET` e trate `/api/learn/upload-model` como endpoint sensível (sem autenticação no lab local).

## Demo — logins fixos

| Email | Senha | Comportamento |
|-------|-------|---------------|
| `maria@demo.com` | `demo123` | Recomendações decorativas / PLA |
| `joao@demo.com` | `demo123` | Recomendações funcionais / ABS |
| `maker1@demo.com` | `demo123` | Maker sem histórico → populares |

## Fluxo de demo sugerido

1. Abrir `/marketplace` sem login → bloco "Mais populares"
2. Login como Maria → carrossel muda para itens decorativos
3. Logout → login como João → recomendações diferentes
4. Abrir um produto → "Produtos similares" + preview 3D STL
5. Abrir `/learn` → vetores, treino TF, comparar content vs ML, quiz

## Arquitetura

```
src/lib/recommendations/
├── context.ts      # min/max, índices category/material
├── encode.ts       # vetores de produto e usuário
├── similarity.ts   # cosseno
├── training-data.ts
├── model.ts        # rede neural TF.js
├── queries.ts      # Prisma
└── recommend.ts    # orquestração (auto / ml / content)
```

Documentação completa das fases: [`docs/recommendations/`](./docs/recommendations/)

## Testes

```bash
npm run test:unit
```

## Fase 2 — Rede neural (TensorFlow.js)

Treinar o modelo de classificação binária (comprou / não comprou):

```bash
npm run recommendations:train
```

Isso gera `models/recommendations/` (modelo + `metadata.json`). A API passa a usar ML automaticamente:

```
GET /api/recommendations?source=auto   # ML com fallback content-based (default)
GET /api/recommendations?source=ml     # força ML (503 se modelo ausente)
GET /api/recommendations?source=content # Fase 1 (cosseno)
```

> Usa `@tensorflow/tfjs` (pure JS). Para treino mais rápido, instale opcionalmente `@tensorflow/tfjs-node` e rode com `TFJS_USE_NODE=1 npm run recommendations:train`.

## Laboratório interativo (`/learn`)

- **Passo a passo** — mapa do pipeline e traces dos métodos
- **Vetores** — perfil numérico de Maria vs João
- **Treino TF** — playground no browser; opcionalmente **Aplicar no marketplace**
- **Comparar** — content-based vs rede neural lado a lado
- **Quiz / missões** — consolidação com progresso no navegador

No marketplace (logado): toggle **Auto / Content / ML / Ambos**.

## Roadmap

- [x] Fase 1 — Content-based (cosseno)
- [x] Fase 2 — Rede neural (`@tensorflow/tfjs`)
- [ ] Fase 3 — Embeddings / two-tower

## Git Flow

Branches: `main` (produção) · `develop` (integração) · `feature/*` · `release/*` · `hotfix/*`

**Features:** criar sempre a partir de `develop` → `./scripts/new-feature.sh nome-da-feature`

Colaboradores abrem PRs de `feature/*` → `develop`. Releases vão de `release/*` → `main` (aprovação exclusiva de @ilaraca).

Guia completo: [`docs/GITFLOW.md`](./docs/GITFLOW.md)

## Licença

MIT — derivado do projeto 3D Colab.
