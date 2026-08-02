import type * as tfTypes from '@tensorflow/tfjs';

export interface EpochLog {
  epoch: number;
  loss: number;
  valLoss: number;
  valAcc: number;
}

export interface BrowserTrainOptions {
  trainXs: number[][];
  trainYs: number[];
  valXs: number[][];
  valYs: number[];
  epochs: number;
  learningRate: number;
  onEpochEnd?: (log: EpochLog) => void;
}

export interface BrowserTrainResult {
  finalTrainLoss: number;
  finalValLoss: number;
  finalValAcc: number;
  epochsRun: number;
  model: tfTypes.LayersModel;
}

export interface ModelArtifactsPayload {
  modelTopology: object;
  weightSpecs: tfTypes.io.WeightsManifestEntry[];
  weightDataBase64: string;
}

async function createBrowserModel(inputDim: number, learningRate: number) {
  const tf = await import('@tensorflow/tfjs');
  await tf.setBackend('cpu');
  await tf.ready();

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
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({
    optimizer: tf.train.adam(learningRate),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  return { tf, model };
}

export async function trainInBrowser(
  options: BrowserTrainOptions
): Promise<BrowserTrainResult> {
  const inputDim = options.trainXs[0]?.length ?? 0;
  const { model } = await createBrowserModel(inputDim, options.learningRate);

  let bestValLoss = Infinity;
  let patienceCounter = 0;
  let lastLogs: EpochLog = { epoch: 0, loss: 0, valLoss: 0, valAcc: 0 };
  let epochsRun = 0;

  const tf = await import('@tensorflow/tfjs');
  const trainXs = tf.tensor2d(options.trainXs);
  const trainYs = tf.tensor2d(options.trainYs.map((label) => [label]));
  const valXs = tf.tensor2d(options.valXs);
  const valYs = tf.tensor2d(options.valYs.map((label) => [label]));

  await model.fit(trainXs, trainYs, {
    epochs: options.epochs,
    batchSize: 32,
    shuffle: true,
    validationData: [valXs, valYs],
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        epochsRun = epoch + 1;
        lastLogs = {
          epoch: epochsRun,
          loss: Number(logs?.loss ?? 0),
          valLoss: Number(logs?.val_loss ?? 0),
          valAcc: Number(logs?.val_acc ?? logs?.val_accuracy ?? 0),
        };
        options.onEpochEnd?.(lastLogs);

        if (lastLogs.valLoss < bestValLoss) {
          bestValLoss = lastLogs.valLoss;
          patienceCounter = 0;
          return;
        }

        patienceCounter += 1;
        if (patienceCounter >= 5) {
          model.stopTraining = true;
        }
      },
    },
  });

  trainXs.dispose();
  trainYs.dispose();
  valXs.dispose();
  valYs.dispose();

  return {
    finalTrainLoss: lastLogs.loss,
    finalValLoss: lastLogs.valLoss,
    finalValAcc: lastLogs.valAcc,
    epochsRun,
    model,
  };
}

export async function exportModelArtifacts(
  model: tfTypes.LayersModel
): Promise<ModelArtifactsPayload> {
  const tf = await import('@tensorflow/tfjs');
  let captured: tfTypes.io.ModelArtifacts | null = null;

  const handler = tf.io.withSaveHandler(async (artifacts) => {
    captured = artifacts;
    return {
      modelArtifactsInfo: {
        dateSaved: new Date(),
        modelTopologyType: 'JSON',
      },
    };
  });

  await model.save(handler);

  const artifacts = captured as tfTypes.io.ModelArtifacts | null;
  if (!artifacts?.modelTopology || !artifacts.weightData) {
    throw new Error('Failed to export model artifacts');
  }

  const weightDataBase64 = Buffer.from(artifacts.weightData as ArrayBuffer).toString('base64');

  return {
    modelTopology: artifacts.modelTopology as object,
    weightSpecs: artifacts.weightSpecs ?? [],
    weightDataBase64,
  };
}

export async function uploadModelToServer(options: {
  model: tfTypes.LayersModel;
  trainExamples: number;
  valExamples: number;
  finalTrainLoss: number;
  finalValLoss: number;
  finalValAccuracy: number;
  inputDimension: number;
  epochsRun: number;
}): Promise<void> {
  const artifacts = await exportModelArtifacts(options.model);

  const response = await fetch('/api/learn/upload-model', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...artifacts,
      trainExamples: options.trainExamples,
      valExamples: options.valExamples,
      finalTrainLoss: options.finalTrainLoss,
      finalValLoss: options.finalValLoss,
      finalValAccuracy: options.finalValAccuracy,
      inputDimension: options.inputDimension,
      epochsRun: options.epochsRun,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? 'Falha ao enviar modelo');
  }
}
