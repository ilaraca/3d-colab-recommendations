import { createModel, predictBatch } from '@/lib/recommendations/model';
import { getTensorFlow } from '@/lib/recommendations/tensorflow';

describe('model', () => {
  it('creates a compilable sequential model', async () => {
    const model = await createModel(20);
    expect(model.layers.length).toBe(4);
    model.dispose();
  });

  it('predicts scores with shape [N]', async () => {
    const tf = await getTensorFlow();
    const model = await createModel(6);

    const inputs = [
      [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
      [0.6, 0.5, 0.4, 0.3, 0.2, 0.1],
    ];

    const scores = await predictBatch(model, inputs);
    expect(scores).toHaveLength(2);
    scores.forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    model.dispose();
    tf.disposeVariables();
  });
});
