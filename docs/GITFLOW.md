# Git Flow — branches e releases

Este repositório segue [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/) com automação via GitHub Actions e **versionamento semântico automático** (Conventional Commits).

## Branches

| Branch | Propósito | Quem mergeia |
|--------|-----------|--------------|
| `main` | **Produção** — código estável | Somente **@ilaraca** aprova PRs de `release/*` ou `hotfix/*` |
| `develop` | **Integração** — próxima release | Colaboradores via PR (após CI verde) |
| `release/X.Y.Z` | Estabilização antes de produção | PR automático de `develop` |
| `feature/*` | Nova funcionalidade | Colaboradores → PR para `develop` |
| `hotfix/*` | Correção urgente em produção | PR para `main` (aprovação @ilaraca) |

## Fluxo automático completo

```
feature/* ──push──► Auto Pull Request ──► PR → develop
                                              │
develop ──push──► Auto Release Sync ──────────┤
         │         (calcula semver)           │
         │         feat → MINOR               │
         │         fix  → PATCH               │
         │         BREAKING → MAJOR           ▼
         └──► PR develop → release/X.Y.Z
                              │
                   merge ────►│
                              ▼
              release/* ──push──► Auto Release PR ──► PR → main
                                                          │
                                              merge (@ilaraca)
                                                          ▼
                                              tag vX.Y.Z + GitHub Release
```

## Versionamento semântico (automático)

A versão é calculada pelos commits convencionais desde a **última tag em `main`**:

| Commit | Bump | Exemplo |
|--------|------|---------|
| `feat:` | **MINOR** | `1.0.0` → `1.1.0` |
| `fix:`, `perf:` | **PATCH** | `1.0.0` → `1.0.1` |
| `BREAKING CHANGE` ou `feat!:` | **MAJOR** | `1.0.0` → `2.0.0` |
| `chore:`, `docs:`, `ci:` | — | não abre release |

**Primeira release** (sem tags): próximo `feat`/`fix` → **`1.0.0`**

Testar localmente:

```bash
npm run semver:calc
# {"nextVersion":"1.0.0","bump":"minor",...}
```

## Para colaboradores (fork / feature)

```bash
git fetch upstream
git checkout -b feature/minha-feature upstream/develop
git commit -m "feat(learn): adiciona painel de vetores"
git push origin feature/minha-feature
# Auto Pull Request abre PR → develop
```

## Para o maintainer (@ilaraca)

### Publicar release (automático)

1. Features mergeadas em **`develop`** (via PR)
2. **Auto Release Sync** calcula versão e abre PR **`develop` → `release/X.Y.Z`**
3. Merge do PR develop → release (após CI)
4. **Auto Release PR** abre PR **`release/X.Y.Z` → `main`**
5. **Você aprova** e mergeia em `main`
6. Tag **`vX.Y.Z`** + GitHub Release criados automaticamente

### Forçar recálculo manual

**Actions → Auto Release Sync → Run workflow** (ou **Start Release** como atalho)

### Hotfix urgente

```bash
git checkout main && git pull
git checkout -b hotfix/1.0.1
git commit -m "fix: corrige score ML"
git push -u origin hotfix/1.0.1
# Auto Release PR abre PR hotfix → main
```

## Workflows

| Workflow | Gatilho | Função |
|----------|---------|--------|
| `CI` | PRs | lint, testes, build |
| `Git Flow Guard` | PRs | Valida origem/destino |
| `Auto Pull Request` | Push `feature/**` | PR → `develop` |
| `Auto Release Sync` | Push `develop` | Calcula semver + PR → `release/*` |
| `Auto Release PR` | Push `release/**` / `hotfix/**` | PR → `main` |
| `Release` | Merge em `main` | Cria tag + GitHub Release |
| `Start Release` | Manual | Atalho → dispara Auto Release Sync |

### Permissões do Actions (obrigatório)

**Settings → Actions → General → Workflow permissions:**

1. **Read and write permissions**
2. **Allow GitHub Actions to create and approve pull requests**

## Proteção de branches

```bash
chmod +x scripts/setup-branch-protection.sh
./scripts/setup-branch-protection.sh
```

## Commits semânticos

```
feat(escopo): nova funcionalidade     → MINOR
fix(escopo): correção de bug          → PATCH
perf(escopo): melhoria de performance → PATCH
feat!(escopo): breaking change        → MAJOR
chore(escopo): manutenção             → sem bump
docs(escopo): documentação            → sem bump
```

Exemplos: `feat(learn): adiciona quiz`, `fix(recommendations): corrige score ML`
