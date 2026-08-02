#!/usr/bin/env bash
# Configura branch protection no GitHub para Git Flow.
# Requer: gh CLI autenticado (gh auth login)
#
# Uso:
#   ./scripts/setup-branch-protection.sh
#   REPO_OWNER=outro-owner ./scripts/setup-branch-protection.sh

set -euo pipefail

OWNER="${REPO_OWNER:-ilaraca}"
REPO="${REPO_NAME:-3d-colab-recommendations}"
MAINTAINER="${MAINTAINER:-ilaraca}"

echo "→ Configurando branch protection em ${OWNER}/${REPO}"
echo "  Maintainer (aprovador de main): @${MAINTAINER}"

require_gh() {
  if ! command -v gh >/dev/null 2>&1; then
    echo "Erro: GitHub CLI (gh) não encontrado. Instale em https://cli.github.com/"
    exit 1
  fi
  gh auth status >/dev/null 2>&1 || {
    echo "Erro: gh não autenticado. Execute: gh auth login"
    exit 1
  }
}

protect_main() {
  echo "→ Protegendo main (produção)..."
  gh api \
    --method PUT \
    "repos/${OWNER}/${REPO}/branches/main/protection" \
    --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "lint-test-build", "app_id": -1 },
      { "context": "validate-branch-flow", "app_id": -1 }
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1,
    "require_last_push_approval": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true
}
JSON
  echo "   ✓ main protegida (PR + CI + CODEOWNERS @ilaraca)"
}

protect_develop() {
  echo "→ Protegendo develop (integração)..."
  gh api \
    --method PUT \
    "repos/${OWNER}/${REPO}/branches/develop/protection" \
    --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "lint-test-build", "app_id": -1 },
      { "context": "validate-branch-flow", "app_id": -1 }
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true
}
JSON
  echo "   ✓ develop protegida (PR + CI, sem code owner obrigatório)"
}

protect_release_wildcard() {
  echo "→ Protegendo release/* ..."
  gh api \
    --method PUT \
    "repos/${OWNER}/${REPO}/branches/release/*" \
    --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "lint-test-build", "app_id": -1 },
      { "context": "validate-branch-flow", "app_id": -1 }
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
  echo "   ✓ release/* protegida"
}

main() {
  require_gh
  protect_main
  protect_develop
  protect_release_wildcard 2>/dev/null || echo "   ⚠ release/* rule skipped (requer GitHub Team/Enterprise ou config manual)"
  echo ""
  echo "Concluído. Resumo do fluxo:"
  echo "  feature/*  → develop     (colaboradores podem abrir PR e merge após CI)"
  echo "  develop    → release/X.Y.Z (workflow Start Release ou manual)"
  echo "  release/*  → main         (somente @${MAINTAINER} aprova via CODEOWNERS)"
  echo "  hotfix/*   → main         (somente @${MAINTAINER} aprova via CODEOWNERS)"
}

main "$@"
