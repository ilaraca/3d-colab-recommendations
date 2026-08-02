#!/usr/bin/env bash
# Cria branch feature/* a partir de develop (Git Flow).
#
# Uso:
#   ./scripts/new-feature.sh minha-feature
#   ./scripts/new-feature.sh learn/quiz-interativo

set -euo pipefail

SLUG="${1:-}"
REMOTE="${GIT_REMOTE:-origin}"
DEVELOP_BRANCH="${DEVELOP_BRANCH:-develop}"

if [ -z "$SLUG" ]; then
  echo "Uso: $0 <nome-da-feature>"
  echo "Exemplo: $0 learn/quiz-interativo  →  branch feature/learn/quiz-interativo"
  exit 1
fi

# Normaliza slug (sem prefixo feature/)
SLUG="${SLUG#feature/}"
BRANCH="feature/${SLUG}"

echo "→ Atualizando ${REMOTE}/${DEVELOP_BRANCH}..."
git fetch "$REMOTE" "$DEVELOP_BRANCH"

if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  echo "Erro: branch local '${BRANCH}' já existe."
  exit 1
fi

if git ls-remote --heads "$REMOTE" "$BRANCH" | grep -q "$BRANCH"; then
  echo "Erro: branch remota '${REMOTE}/${BRANCH}' já existe."
  exit 1
fi

echo "→ Criando ${BRANCH} a partir de ${REMOTE}/${DEVELOP_BRANCH}..."
git checkout -b "$BRANCH" "${REMOTE}/${DEVELOP_BRANCH}"

echo ""
echo "✓ Branch ${BRANCH} criada a partir de ${DEVELOP_BRANCH}."
echo ""
echo "Próximos passos:"
echo "  git commit -m \"feat(escopo): descrição\""
echo "  git push -u ${REMOTE} ${BRANCH}"
echo "  # Auto Pull Request abrirá PR → develop"
