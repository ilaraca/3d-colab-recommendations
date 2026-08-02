export const FEATURE_DESCRIPTIONS: Record<string, string> = {
  price: 'Preço normalizado (0–1) entre o menor e maior do catálogo, ponderado.',
  avgRating: 'Média das avaliações do produto (escala 0–5), normalizada.',
  printTime: 'Tempo estimado de impressão 3D, normalizado pelo catálogo.',
  volume: 'Volume físico (largura × altura × profundidade), normalizado.',
  weight: 'Peso do produto em gramas, normalizado pelo catálogo.',
};

export function describeFeatureLabel(label: string): string {
  if (FEATURE_DESCRIPTIONS[label]) {
    return FEATURE_DESCRIPTIONS[label];
  }
  if (label.startsWith('category:')) {
    return `One-hot da categoria "${label.replace('category:', '')}" — indica preferência por este tipo de produto.`;
  }
  if (label.startsWith('material:')) {
    return `One-hot do material "${label.replace('material:', '')}" — indica preferência por este filamento/material.`;
  }
  return 'Feature codificada do produto ou perfil do usuário.';
}

export const WEIGHT_DESCRIPTIONS: Record<string, string> = {
  category: 'Categoria tem o maior peso — define fortemente a similaridade.',
  material: 'Material (PLA, ABS…) é o segundo fator mais importante.',
  price: 'Faixa de preço preferida pelo usuário.',
  avgRating: 'Preferência por produtos bem avaliados.',
  printTime: 'Tempo de impressão como sinal secundário.',
  volume: 'Tamanho físico do objeto.',
  weight: 'Peso do produto impresso.',
};
