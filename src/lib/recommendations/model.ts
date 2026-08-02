import type * as tfTypes from '@tensorflow/tfjs';
import { getTensorFlow } from './tensorflow';

export interface TrainModelOptions {
  trainXs: tfTypes.Tensor2D;
  trainYs: tfTypes.Tensor2D;
  valXs: tfTypes.Tensor2D;
  valYs: tfTypes.Tensor2D;
  epochs?: number;
  onEpochEnd?: (epoch: number, logs: tfTypes.Logs) => void;
}

export interface TrainModelResult {
  model: tfTypes.LayersModel;
  finalTrainLoss: number;
  finalValLoss: number;
  finalValAccuracy: number;
  epochsRun: number;
}

export async function createModel(inputDim: number): Promise<tfTypes.Sequential> {
  const tf = await getTensorFlow();
  const model = tf.sequential();

  model.add(
    tf.layers.dense({
      inputShape: [inputDim],
      units: 64,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
    })
  );

  model.add(tf.layers.dropout({ rate: 0.2 }));

  model.add(
    tf.layers.dense({
      units: 32,
      activation: 'relu',
    })
  );

  model.add(
    tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
    })
  );

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

export async function trainRecommendationModel(
  options: TrainModelOptions
): Promise<TrainModelResult> {
  const tf = await getTensorFlow();
  const model = await createModel(options.trainXs.shape[1]!);
  const maxEpochs = options.epochs ?? 50;
  const patience = 5;

  let bestValLoss = Infinity;
  let patienceCounter = 0;
  let lastLogs: tfTypes.Logs = {};
  let epochsRun = 0;

  await model.fit(options.trainXs, options.trainYs, {
    epochs: maxEpochs,
    batchSize: 32,
    shuffle: true,
    validationData: [options.valXs, options.valYs],
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        epochsRun = epoch + 1;
        lastLogs = logs ?? {};
        options.onEpochEnd?.(epoch, lastLogs);

        const valLoss = logs?.val_loss;
        if (typeof valLoss !== 'number') return;

        if (valLoss < bestValLoss) {
          bestValLoss = valLoss;
          patienceCounter = 0;
          return;
        }

        patienceCounter += 1;
        if (patienceCounter >= patience) {
          model.stopTraining = true;
        }
      },
    },
  });

  return {
    model,
    finalTrainLoss: Number(lastLogs.loss ?? 0),
    finalValLoss: Number(lastLogs.val_loss ?? 0),
    finalValAccuracy: Number(lastLogs.val_acc ?? lastLogs.val_accuracy ?? 0),
    epochsRun,
  };
}

export async function predictBatch(
  model: tfTypes.LayersModel,
  inputs: number[][]
): Promise<number[]> {
  const tf = await getTensorFlow();

  if (inputs.length === 0) return [];

  const inputTensor = tf.tensor2d(inputs);
  const predictions = model.predict(inputTensor) as tfTypes.Tensor;
  const scores = Array.from(await predictions.data());

  inputTensor.dispose();
  predictions.dispose();

  return scores;
}
