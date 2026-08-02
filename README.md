# 3D Colab Recommendations

Marketplace 3D **lite** derivado do [3D Colab](https://github.com/ilaraca/3d-colab), focado em demonstrar um **sistema de recomendação content-based** (Fase 1) para a pós-graduação.

> Pipeline: **contexto → encode (produto/usuário) → similaridade de cosseno → ranking**

## O que tem neste repo

- UI do marketplace 3D Colab (visual familiar)
- Preview 3D de arquivos STL nos produtos
- Sistema de recomendação personalizado (Fase 1)
- Logins fixos para demo ao vivo
- Seed com 20 produtos e históricos distintos

## O que foi removido (vs 3D Colab completo)

Pagamentos (Mercado Pago), chat, escrow, upload, doações, admin e demais complexidades de produção.

## Setup rápido

```bash
git clone https://github.com/ilaraca/3d-colab-recommendations.git
cd 3d-colab-recommendations
cp .env.example .env

# Subir PostgreSQL
docker compose up -d

# Instalar e configurar banco
npm install
npx prisma migrate dev --name init
npm run seed

# Rodar
npm run dev
```

Acesse: http://localhost:3000

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

## Arquitetura

```
src/lib/recommendations/
├── context.ts      # min/max, índices category/material
├── encode.ts       # vetores de produto e usuário
├── similarity.ts   # cosseno
├── queries.ts      # Prisma
└── recommend.ts    # orquestração
```

Documentação completa das fases: [`docs/recommendations/`](./docs/recommendations/)

## Testes

```bash
npm run test:unit
```

## Roadmap

- [x] Fase 1 — Content-based (cosseno)
- [ ] Fase 2 — Rede neural (`@tensorflow/tfjs-node`)
- [ ] Fase 3 — Embeddings / two-tower

## Git Flow

Branches: `main` (produção) · `develop` (integração) · `feature/*` · `release/*` · `hotfix/*`

Colaboradores abrem PRs de `feature/*` → `develop`. Releases vão de `release/*` → `main` (aprovação exclusiva de @ilaraca).

Guia completo: [`docs/GITFLOW.md`](./docs/GITFLOW.md)

## Licença

MIT — derivado do projeto 3D Colab.
