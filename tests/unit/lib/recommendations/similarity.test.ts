import { cosineSimilarity, averageVectors } from '@/lib/recommendations/similarity';

describe('similarity', () => {
  it('returns 1 for identical vectors', () => {
    const v = [1, 2, 3];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1);
  });

  it('returns ~0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('does not divide by zero for zero vector', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it('averages vectors correctly', () => {
    const result = averageVectors([
      [2, 4],
      [4, 8],
    ]);
    expect(result).toEqual([3, 6]);
  });
});
