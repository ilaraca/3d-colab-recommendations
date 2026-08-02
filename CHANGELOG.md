# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e o projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/)
(automático via Conventional Commits no Git Flow).

## [Unreleased]

Trabalho acumulado em `develop` até a primeira release estável (`1.0.0`).

### Added

#### Marketplace 3D lite (base)

- Marketplace derivado do 3D Colab, sem pagamentos, chat, escrow, upload, doações nem admin
- Listagem e filtros de produtos; páginas de detalhe com preview 3D (STL / Three.js)
- Autenticação com NextAuth e logins demo fixos (`maria@demo.com`, `joao@demo.com`, `maker1@demo.com`)
- Seed Prisma com 20 produtos, 4 makers, 2 compradores com históricos distintos e STLs de demonstração
- Docker Compose (PostgreSQL + pgAdmin) e `.env.example` para setup local

#### Docker — stack completa

- `Dockerfile` multi-stage (deps → builder → runner) com Next.js `output: standalone`
- Serviço `app` no `docker-compose.yaml` — aplicação Next.js containerizada na porta 3000
- `docker/entrypoint.sh` — `prisma migrate deploy` automático antes de iniciar o servidor
- `docker/setup.sh` + `npm run docker:setup` — aguarda Postgres saudável, migrate e seed
- Scripts npm: `docker:up`, `docker:down`, `docker:reset`, `docker:logs`
- Volume `ml_models` — persiste modelos ML uploadados/treinados em `models/recommendations/`
- Healthcheck no PostgreSQL 16; defaults para variáveis `POSTGRES_*` e `NEXTAUTH_*`
- Profile `setup` (one-shot) para migrate + seed via container builder
- Dependência **sharp** para otimização de imagens (`next/image`) em produção/Docker
- `.dockerignore` para contexto de build enxuto

#### Fase 1 — Content-based

- Pipeline `contexto → encode → similaridade de cosseno → ranking`
- Encoding de produto (preço, rating, tempo de impressão, volume, peso, categoria, material)
- Encoding de usuário a partir do histórico de compras
- Modos de recomendação: personalizado, populares e produtos similares
- API `GET /api/recommendations` com parâmetros `mode`, `source`, `limit`, etc.

#### Fase 2 — Rede neural (TensorFlow.js)

- Modelo de classificação binária (comprou / não comprou) com `@tensorflow/tfjs`
- Dataset supervisionado com leave-one-out (correção de vazamento do demo original)
- Split treino/validação por usuário; early stopping
- Script `npm run recommendations:train` gerando artefatos em `models/recommendations/`
- Scoring híbrido: `source=auto|ml|content` com fallback content-based
- Treino opcional acelerado com `@tensorflow/tfjs-node` (`TFJS_USE_NODE=1`)
- Upload de modelo treinado no browser para o servidor (`POST /api/learn/upload-model`)

#### Laboratório interativo (`/learn`)

- UI educacional: mapa do pipeline, explorer de métodos, vetores, treino TF, comparação e quiz
- Traces de métodos: cálculos reais em fixtures e execuções ilustradas para efeitos colaterais
- Personas demo (Maria / João) com perfis e rankings lado a lado
- Playground de treino no browser com gráfico de loss / val_loss
- Botão “Aplicar no marketplace” após treinar no browser
- Missões guiadas com progresso no `localStorage`
- Quiz por trilhas (analogias, content-based, ML, pipeline)
- Toggle **Auto / Content / ML / Ambos** no marketplace (usuário logado)

#### APIs do laboratório

- `GET /api/learn/demo-users`
- `GET /api/learn/vectors`
- `GET /api/learn/dataset`
- `GET /api/learn/training-pairs`
- `GET /api/learn/recommendations` (restrito a e-mails demo)
- `GET /api/learn/method-traces`
- `GET /api/learn/model-status`
- `POST /api/learn/upload-model`

#### Testes e qualidade

- Testes unitários do pipeline: encode, similarity, training-data, model, quiz-questions
- ESLint (`next lint`) e build de produção Next.js 14
- CI GitHub Actions: lint → testes unitários → build (Node 20)

#### Git Flow e automação

- Branches `main` / `develop` / `feature/*` / `release/*` / `hotfix/*`
- Workflows: CI, Git Flow Guard, Auto PR (`feature/*` → `develop`), Auto Release Sync, Auto Release PR, Start Release, Release
- Versionamento semântico automático a partir de Conventional Commits (`scripts/calculate-semver.ts`)
- Script `scripts/new-feature.sh` para criar features a partir de `develop`
- Script `scripts/setup-branch-protection.sh` e `CODEOWNERS`
- Template de pull request

#### Documentação e assets

- README expandido (~1000 linhas): índice, referência da API, seção Docker, troubleshooting, deploy
- Spec de deploy e proteção do upload em `docs/deployment/spec.md` (draft)
- Documentação completa em `docs/recommendations/` (fases, lab, fluxogramas)
- Guia Git Flow em `docs/GITFLOW.md`
- `CHANGELOG.md` (Keep a Changelog)
- Gerador de STLs de demonstração (`npm run assets:stl`)
- Imagens, avatares e modelos STL em `public/`
- Licença MIT

### Changed

- README reestruturado: Opção A (Docker) e Opção B (dev local), seção Docker dedicada, link ao CHANGELOG
- Preview 3D (STL): pré-carregamento do bundle Three.js, spinner de loading, cleanup de memória e pixel ratio limitado
- `docker-compose.yaml`: Postgres 16 Alpine, serviço `app`, healthchecks e volumes nomeados
- `.env.example` com comentários para `DATABASE_URL` local vs Docker
- Configuração Next.js/Webpack para ignorar `@tensorflow/tfjs-node` opcional no bundle
- Seed e assets alinhados às personas e produtos da demo ao vivo

### Fixed

- Cleanup do Three.js ao desmontar preview 3D (geometry, material, animation frame)
- Ruído do TensorFlow.js silenciado nos testes unitários
- Build Docker: `npm ci --ignore-scripts` + `prisma generate` no stage correto (evita erro de schema ausente)
- Postgres `exited (1)` no Docker — defaults de env, healthcheck e script `docker:reset` para volumes incompatíveis
- Erro `sharp missing in production` no standalone — sharp + `@img/*` copiados para imagem final
- Resolução TypeScript / bundle do `@tensorflow/tfjs-node` opcional
- Retorno em `scripts/calculate-semver.ts` para o build/CI
- Auto-PR usando GitHub API (sem depender do `gh` CLI no runner)
- Guard que exige `feature/*` criada a partir de `develop`
- Diagrama Mermaid do Git Flow na documentação
- Configuração ESLint para `next lint` não interativo no CI

### Security / notas de escopo

- Credenciais demo fixas (`demo123`) — intencionais para aula e demo ao vivo
- `/api/learn/upload-model` sem autenticação — adequado ao lab local; spec de proteção em `docs/deployment/spec.md`
- Modelos treinados em `models/recommendations/` não versionados (artefato gerado; volume Docker `ml_models` persiste em runtime)

### Planned

- Fase 3 — Embeddings / arquitetura two-tower

---

## Comparativo de fases

| Fase | Status | Abordagem |
|------|--------|-----------|
| 1 — Content-based | Implementada | Similaridade de cosseno sobre vetores de atributos |
| 2 — Rede neural | Implementada | Classificação binária com TensorFlow.js |
| 3 — Avançada | Planejada | Embeddings / two-tower |

[Unreleased]: https://github.com/ilaraca/3d-colab-recommendations/compare/main...develop
