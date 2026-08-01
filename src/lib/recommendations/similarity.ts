export function normalize(value: number, min: number, max: number): number {
  return (value - min) / ((max - min) || 1);
}

export function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];

  const length = vectors[0].length;
  const result = new Array(length).fill(0);

  for (const vector of vectors) {
    for (let i = 0; i < length; i++) {
      result[i] += vector[i];
    }
  }

  return result.map((value) => value / vectors.length);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / ((magA * magB) || 1);
}

export function oneHotWeighted(index: number, length: number, weight: number): number[] {
  return Array.from({ length }, (_, i) => (i === index ? weight : 0));
}
