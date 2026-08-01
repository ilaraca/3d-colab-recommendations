export const PRODUCT_CATEGORIES = {
  decorative: 'Decorativo',
  functional: 'Funcional',
  educational: 'Educacional',
  figure: 'Figuras',
  prototype: 'Protótipo',
  part: 'Peças',
} as const;

export type ProductCategory = keyof typeof PRODUCT_CATEGORIES;

export const DEMO_USERS = [
  { email: 'maria@demo.com', password: 'demo123', hint: 'Histórico decorativo / PLA' },
  { email: 'joao@demo.com', password: 'demo123', hint: 'Histórico funcional / ABS' },
  { email: 'maker1@demo.com', password: 'demo123', hint: 'Maker sem compras' },
] as const;
