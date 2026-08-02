/**
 * Gera os STLs de demonstração usados pelo seed, em public/models/.
 *
 * Cada modelo é construído a partir das mesmas dimensões (em cm) registradas
 * no produto correspondente em prisma/seed.ts, convertidas para milímetros.
 *
 * O visualizador (src/components/three-scene.tsx) não corrige a convenção Z-up
 * do formato STL, então a malha é autorada com Y para cima.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Vec3 = [number, number, number];
type Tri = [Vec3, Vec3, Vec3];
/** Ponto do plano XZ, usado para seções transversais e perfis de revolução. */
type Point2 = [number, number];

const CM = 10;

// ---------------------------------------------------------------------------
// Álgebra
// ---------------------------------------------------------------------------

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function faceNormal([a, b, c]: Tri): Vec3 {
  const n = cross(sub(b, a), sub(c, a));
  const len = Math.hypot(n[0], n[1], n[2]);
  return len === 0 ? [0, 0, 0] : [n[0] / len, n[1] / len, n[2] / len];
}

function reverse([a, b, c]: Tri): Tri {
  return [c, b, a];
}

// ---------------------------------------------------------------------------
// Primitivas de malha
// ---------------------------------------------------------------------------

function quad(a: Vec3, b: Vec3, c: Vec3, d: Vec3): Tri[] {
  return [
    [a, b, c],
    [a, c, d],
  ];
}

function box(center: Vec3, size: Vec3): Tri[] {
  const [cx, cy, cz] = center;
  const [w, h, d] = size;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;

  return [
    ...quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]), // frente (+Z)
    ...quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]), // trás (-Z)
    ...quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]), // direita (+X)
    ...quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]), // esquerda (-X)
    ...quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]), // topo (+Y)
    ...quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]), // base (-Y)
  ];
}

/** Converte uma seção transversal do plano XZ num anel de vértices na altura y. */
function ring(section: Point2[], y: number): Vec3[] {
  return section.map(([x, z]) => [x, y, z] as Vec3);
}

/**
 * Parede lateral entre dois anéis de mesma contagem de pontos, ordenados no
 * sentido anti-horário. As normais apontam para fora quando `upper` está acima.
 */
function loft(lower: Vec3[], upper: Vec3[]): Tri[] {
  const tris: Tri[] = [];
  for (let i = 0; i < lower.length; i++) {
    const j = (i + 1) % lower.length;
    tris.push(...quad(lower[i], upper[i], upper[j], lower[j]));
  }
  return tris;
}

/** Tampa plana de um polígono convexo. `up` orienta a normal para +Y. */
function cap(points: Vec3[], up: boolean): Tri[] {
  const tris: Tri[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const tri: Tri = [points[0], points[i], points[i + 1]];
    tris.push(up ? reverse(tri) : tri);
  }
  return tris;
}

/** Tampa anelar entre um contorno externo e um furo interno, na mesma altura. */
function capBand(outer: Vec3[], inner: Vec3[], up: boolean): Tri[] {
  const tris: Tri[] = [];
  for (let i = 0; i < outer.length; i++) {
    const j = (i + 1) % outer.length;
    const pair: Tri[] = [
      [outer[i], outer[j], inner[j]],
      [outer[i], inner[j], inner[i]],
    ];
    tris.push(...(up ? pair.map(reverse) : pair));
  }
  return tris;
}

/**
 * Revolve um perfil fechado no plano (raio, altura) em torno do eixo Y.
 * O perfil deve ser percorrido de forma que o material fique à sua direita:
 * subindo pela parede externa e descendo pela interna.
 */
function revolve(profile: Point2[], segments: number): Tri[] {
  const tris: Tri[] = [];
  for (let s = 0; s < segments; s++) {
    const a0 = (2 * Math.PI * s) / segments;
    const a1 = (2 * Math.PI * (s + 1)) / segments;
    for (let i = 0; i < profile.length; i++) {
      const [r0, y0] = profile[i];
      const [r1, y1] = profile[(i + 1) % profile.length];
      const A: Vec3 = [r0 * Math.cos(a0), y0, r0 * Math.sin(a0)];
      const B: Vec3 = [r0 * Math.cos(a1), y0, r0 * Math.sin(a1)];
      const C: Vec3 = [r1 * Math.cos(a1), y1, r1 * Math.sin(a1)];
      const D: Vec3 = [r1 * Math.cos(a0), y1, r1 * Math.sin(a0)];
      tris.push(...quad(A, D, C, B));
    }
  }
  return tris;
}

/** Seção arredondada: n=2 gera elipse, n grande aproxima um retângulo. */
function superellipse(rx: number, rz: number, n: number, segments: number): Point2[] {
  const pts: Point2[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (2 * Math.PI * i) / segments;
    const c = Math.cos(t);
    const s = Math.sin(t);
    pts.push([
      rx * Math.sign(c) * Math.abs(c) ** (2 / n),
      rz * Math.sign(s) * Math.abs(s) ** (2 / n),
    ]);
  }
  return pts;
}

function circle(r: number, segments: number): Point2[] {
  return superellipse(r, r, 2, segments);
}

function rotateSection(section: Point2[], angle: number): Point2[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return section.map(([x, z]) => [x * c - z * s, x * s + z * c] as Point2);
}

function scaleSection(section: Point2[], factor: number): Point2[] {
  return section.map(([x, z]) => [x * factor, z * factor] as Point2);
}

/** Empilha seções transversais em alturas crescentes, fechando as extremidades. */
function stack(sections: { section: Point2[]; y: number }[]): Tri[] {
  const rings = sections.map(({ section, y }) => ring(section, y));
  const tris: Tri[] = [...cap(rings[0], false)];
  for (let i = 0; i < rings.length - 1; i++) {
    tris.push(...loft(rings[i], rings[i + 1]));
  }
  tris.push(...cap(rings[rings.length - 1], true));
  return tris;
}

// ---------------------------------------------------------------------------
// Modelos
// ---------------------------------------------------------------------------

/** Vaso Geométrico — 12 x 18 x 12 cm, parede facetada e interior oco. */
function vasoGeometrico(): Tri[] {
  const profile: Point2[] = [
    [0, 0],
    [4.0 * CM, 0],
    [6.0 * CM, 6.0 * CM],
    [5.4 * CM, 13.0 * CM],
    [6.0 * CM, 18.0 * CM],
    [5.2 * CM, 18.0 * CM],
    [4.6 * CM, 13.0 * CM],
    [5.2 * CM, 6.0 * CM],
    [3.2 * CM, 1.2 * CM],
    [0, 1.2 * CM],
  ];
  return revolve(profile, 10);
}

/** Escultura Abstrata — 15 x 25 x 10 cm, prisma torcido com estrangulamento. */
function esculturaAbstrata(): Tri[] {
  const steps = 48;
  const height = 25 * CM;
  const base = superellipse(7.5 * CM, 5.0 * CM, 4, 40);

  const sections = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const waist = 1 - 0.45 * Math.sin(Math.PI * t);
    const taper = 1 - 0.3 * t;
    return {
      section: rotateSection(scaleSection(base, waist * taper), t * Math.PI * 1.1),
      y: t * height,
    };
  });

  return stack(sections);
}

/** Organizador de Mesa — 20 x 8 x 15 cm, caixa aberta com dois divisores. */
function organizadorDeMesa(): Tri[] {
  const w = 20 * CM;
  const h = 8 * CM;
  const d = 15 * CM;
  const t = 0.4 * CM;

  return [
    ...box([0, t / 2, 0], [w, t, d]),
    ...box([0, h / 2, -(d - t) / 2], [w, h, t]),
    ...box([0, h / 2, (d - t) / 2], [w, h, t]),
    ...box([-(w - t) / 2, h / 2, 0], [t, h, d]),
    ...box([(w - t) / 2, h / 2, 0], [t, h, d]),
    ...box([-w / 6, (h * 0.8) / 2, 0], [t, h * 0.8, d]),
    ...box([w / 6, (h * 0.8) / 2, 0], [t, h * 0.8, d]),
  ];
}

/** Engrenagem Educacional — 15 x 5 x 15 cm, 20 dentes retos e furo central. */
function engrenagemEducacional(): Tri[] {
  const teeth = 20;
  const tipRadius = 7.5 * CM;
  const rootRadius = 6.3 * CM;
  const bore = 1.5 * CM;
  const thickness = 5 * CM;

  const outerSection: Point2[] = [];
  for (let i = 0; i < teeth; i++) {
    const base = (2 * Math.PI * i) / teeth;
    const step = (2 * Math.PI) / teeth / 4;
    const shape: [number, number][] = [
      [base, rootRadius],
      [base + step * 0.9, tipRadius],
      [base + step * 2.1, tipRadius],
      [base + step * 3, rootRadius],
    ];
    for (const [angle, r] of shape) {
      outerSection.push([r * Math.cos(angle), r * Math.sin(angle)]);
    }
  }
  const boreSection = circle(bore, outerSection.length);

  const outerBottom = ring(outerSection, 0);
  const outerTop = ring(outerSection, thickness);
  const boreBottom = ring(boreSection, 0);
  const boreTop = ring(boreSection, thickness);

  return [
    ...loft(outerBottom, outerTop),
    ...loft(boreTop, boreBottom),
    ...capBand(outerTop, boreTop, true),
    ...capBand(outerBottom, boreBottom, false),
  ];
}

/** Miniatura Dragão — 8 x 12 x 8 cm, corpo estilizado sobre base rochosa. */
function miniaturaDragao(): Tri[] {
  const tris: Tri[] = [];

  const baseHeight = 1.2 * CM;
  tris.push(
    ...revolve(
      [
        [0, 0],
        [3.8 * CM, 0],
        [3.4 * CM, baseHeight],
        [0, baseHeight],
      ],
      9
    )
  );

  const bodySection = superellipse(1.7 * CM, 1.3 * CM, 3, 20);
  tris.push(
    ...stack([
      { section: scaleSection(bodySection, 0.55), y: baseHeight },
      { section: scaleSection(bodySection, 1.0), y: baseHeight + 2.0 * CM },
      { section: scaleSection(bodySection, 0.85), y: baseHeight + 4.2 * CM },
      { section: scaleSection(bodySection, 0.42), y: baseHeight + 5.6 * CM },
    ])
  );

  const neckBase = baseHeight + 5.6 * CM;
  const neckSection = circle(0.75 * CM, 14);
  tris.push(
    ...stack([
      { section: neckSection, y: neckBase },
      { section: scaleSection(neckSection, 0.8), y: neckBase + 2.2 * CM },
      { section: scaleSection(neckSection, 0.95), y: neckBase + 3.4 * CM },
    ])
  );

  const headY = neckBase + 3.9 * CM;
  tris.push(...box([0, headY, 0.4 * CM], [1.8 * CM, 1.2 * CM, 2.4 * CM]));
  tris.push(...box([-0.5 * CM, headY + 0.9 * CM, -0.4 * CM], [0.3 * CM, 0.9 * CM, 0.3 * CM]));
  tris.push(...box([0.5 * CM, headY + 0.9 * CM, -0.4 * CM], [0.3 * CM, 0.9 * CM, 0.3 * CM]));

  // Asas: placas finas inclinadas, espelhadas nos dois lados do corpo.
  for (const side of [-1, 1]) {
    const wing: Point2[] = [
      [side * 1.2 * CM, -1.2 * CM],
      [side * 4.0 * CM, -2.4 * CM],
      [side * 3.6 * CM, 1.6 * CM],
      [side * 1.2 * CM, 0.9 * CM],
    ];
    const shaped = side > 0 ? wing : [...wing].reverse();
    const lower = ring(shaped, baseHeight + 3.4 * CM);
    const upper = ring(shaped, baseHeight + 3.7 * CM);
    tris.push(...cap(lower, false), ...loft(lower, upper), ...cap(upper, true));
  }

  // Cauda: sequência de blocos decrescentes saindo por trás da base.
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const size = (0.9 - 0.6 * t) * CM;
    tris.push(
      ...box(
        [0, baseHeight + (1.6 - 1.1 * t) * CM, -(1.4 + i * 0.55) * CM],
        [size, size, 0.7 * CM]
      )
    );
  }

  return tris;
}

/** Quebra-cabeça 3D — 12 x 12 x 12 cm, grade 3x3x3 com uma peça em L removida. */
function quebraCabeca3d(): Tri[] {
  const cells = 3;
  const cell = (12 * CM) / cells;
  const piece = cell - 0.2 * CM;
  const removed = new Set(['2,2,2', '2,2,1', '2,1,2']);

  const tris: Tri[] = [];
  for (let x = 0; x < cells; x++) {
    for (let y = 0; y < cells; y++) {
      for (let z = 0; z < cells; z++) {
        if (removed.has(`${x},${y},${z}`)) continue;
        const offset = (i: number) => (i - (cells - 1) / 2) * cell;
        tris.push(...box([offset(x), y * cell + cell / 2, offset(z)], [piece, piece, piece]));
      }
    }
  }
  return tris;
}

/** Miniatura Robô — 8 x 14 x 6 cm, blocos articulados empilhados. */
function miniaturaRobo(): Tri[] {
  const tris: Tri[] = [];

  const footH = 0.8 * CM;
  const legH = 4.0 * CM;
  const torsoH = 4.6 * CM;
  const neckH = 0.5 * CM;
  const headH = 2.8 * CM;

  for (const side of [-1, 1]) {
    tris.push(...box([side * 1.5 * CM, footH / 2, 1.0 * CM], [1.9 * CM, footH, 4.0 * CM]));
    tris.push(...box([side * 1.5 * CM, footH + legH / 2, 0], [1.4 * CM, legH, 1.4 * CM]));
  }

  const torsoY = footH + legH;
  tris.push(...box([0, torsoY + torsoH / 2, 0], [4.6 * CM, torsoH, 2.8 * CM]));
  tris.push(...box([0, torsoY + torsoH * 0.62, 1.5 * CM], [2.6 * CM, 1.8 * CM, 0.3 * CM]));
  tris.push(...box([0, torsoY + torsoH * 0.55, -2.3 * CM], [2.6 * CM, 3.0 * CM, 1.4 * CM]));

  for (const side of [-1, 1]) {
    tris.push(...box([side * 3.1 * CM, torsoY + torsoH * 0.72, 0], [1.8 * CM, 2.6 * CM, 1.2 * CM]));
    tris.push(...box([side * 3.1 * CM, torsoY + torsoH * 0.2, 0], [1.6 * CM, 2.4 * CM, 1.0 * CM]));
  }

  const neckY = torsoY + torsoH;
  tris.push(...box([0, neckY + neckH / 2, 0], [1.2 * CM, neckH, 1.2 * CM]));
  tris.push(...box([0, neckY + neckH + headH / 2, 0], [3.4 * CM, headH, 3.0 * CM]));
  tris.push(...box([0, neckY + neckH + headH * 0.55, 1.6 * CM], [2.4 * CM, 1.4 * CM, 0.3 * CM]));
  tris.push(...box([0, neckY + neckH + headH + 0.6 * CM, 0], [0.3 * CM, 1.2 * CM, 0.3 * CM]));

  return tris;
}

// ---------------------------------------------------------------------------
// Escrita
// ---------------------------------------------------------------------------

function writeBinaryStl(path: string, header: string, tris: Tri[]): void {
  const buffer = Buffer.alloc(84 + tris.length * 50);
  buffer.write(header.slice(0, 79).padEnd(80, ' '), 0, 80, 'ascii');
  buffer.writeUInt32LE(tris.length, 80);

  let offset = 84;
  for (const tri of tris) {
    for (const value of [...faceNormal(tri), ...tri.flat()]) {
      buffer.writeFloatLE(value, offset);
      offset += 4;
    }
    buffer.writeUInt16LE(0, offset);
    offset += 2;
  }

  writeFileSync(path, buffer);
}

const MODELS: { file: string; label: string; build: () => Tri[] }[] = [
  { file: 'vaso-geometrico.stl', label: 'Vaso Geometrico 120x180x120mm', build: vasoGeometrico },
  { file: 'escultura-abstrata.stl', label: 'Escultura Abstrata 150x250x100mm', build: esculturaAbstrata },
  { file: 'organizador-de-mesa.stl', label: 'Organizador de Mesa 200x80x150mm', build: organizadorDeMesa },
  { file: 'engrenagem-educacional.stl', label: 'Engrenagem Educacional 150x50x150mm', build: engrenagemEducacional },
  { file: 'miniatura-dragao.stl', label: 'Miniatura Dragao 80x120x80mm', build: miniaturaDragao },
  { file: 'quebra-cabeca-3d.stl', label: 'Quebra-cabeca 3D 120x120x120mm', build: quebraCabeca3d },
  { file: 'miniatura-robo.stl', label: 'Miniatura Robo 80x140x60mm', build: miniaturaRobo },
];

function main(): void {
  const outDir = join(process.cwd(), 'public', 'models');
  mkdirSync(outDir, { recursive: true });

  for (const { file, label, build } of MODELS) {
    const tris = build();
    writeBinaryStl(join(outDir, file), label, tris);
    console.log(`  ${file.padEnd(30)} ${String(tris.length).padStart(6)} triângulos`);
  }

  console.log(`\n✅ ${MODELS.length} STLs gerados em public/models/`);
}

main();
