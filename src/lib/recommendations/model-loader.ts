import fs from 'fs/promises';
import path from 'path';
import type * as tfTypes from '@tensorflow/tfjs';
import { COMPLETED_ORDER_STATUSES } from './constants';
import { getTensorFlow } from './tensorflow';

export const MODEL_DIR = path.join(process.cwd(), 'models/recommendations');
export const METADATA_PATH = path.join(MODEL_DIR, 'metadata.json');

export interface ModelMetadata {
  version: string;
  trainedAt: string;
  trainExamples: number;
  valExamples: number;
  finalTrainLoss: number;
  finalValLoss: number;
  finalValAccuracy: number;
  inputDimension: number;
  epochsRun: number;
  completedOrderStatuses: string[];
}

let cachedModel: tfTypes.LayersModel | null = null;
let cachedMetadata: ModelMetadata | null = null;
let loadPromise: Promise<tfTypes.LayersModel | null> | null = null;

function disposeCachedModelSync(): void {
  if (cachedModel) {
    cachedModel.dispose();
    cachedModel = null;
  }
}

async function resetTensorFlowState(): Promise<void> {
  disposeCachedModelSync();
  const tf = await getTensorFlow();
  tf.disposeVariables();
}

async function createSaveHandler(modelDir: string): Promise<tfTypes.io.IOHandler> {
  const tf = await getTensorFlow();

  return tf.io.withSaveHandler(async (artifacts) => {
    await fs.mkdir(modelDir, { recursive: true });

    const weightsManifest = [
      {
        paths: ['weights.bin'],
        weights: artifacts.weightSpecs ?? [],
      },
    ];

    await fs.writeFile(
      path.join(modelDir, 'model.json'),
      JSON.stringify(
        {
          modelTopology: artifacts.modelTopology,
          weightsManifest,
          format: artifacts.format ?? 'layers-model',
        },
        null,
        2
      )
    );

    if (artifacts.weightData) {
      const buffer = Buffer.from(artifacts.weightData as ArrayBuffer);
      await fs.writeFile(path.join(modelDir, 'weights.bin'), buffer);
    }

    return {
      modelArtifactsInfo: {
        dateSaved: new Date(),
        modelTopologyType: 'JSON',
      },
    };
  });
}

function createLoadHandler(modelDir: string): tfTypes.io.IOHandler {
  return {
    load: async () => {
      const modelJson = JSON.parse(
        await fs.readFile(path.join(modelDir, 'model.json'), 'utf8')
      ) as {
        modelTopology: object;
        weightsManifest: Array<{ paths: string[]; weights: tfTypes.io.WeightsManifestEntry[] }>;
      };

      const weightsBin = await fs.readFile(path.join(modelDir, 'weights.bin'));

      return {
        modelTopology: modelJson.modelTopology,
        weightSpecs: modelJson.weightsManifest[0]?.weights ?? [],
        weightData: weightsBin.buffer.slice(
          weightsBin.byteOffset,
          weightsBin.byteOffset + weightsBin.byteLength
        ),
      };
    },
  };
}

export async function saveModel(
  model: tfTypes.LayersModel,
  metadata: ModelMetadata
): Promise<void> {
  const handler = await createSaveHandler(MODEL_DIR);
  await model.save(handler);
  await fs.writeFile(METADATA_PATH, JSON.stringify(metadata, null, 2));

  if (cachedModel && cachedModel !== model) {
    cachedModel.dispose();
  }

  cachedModel = model;
  cachedMetadata = metadata;
}

export async function loadModelMetadata(): Promise<ModelMetadata | null> {
  if (cachedMetadata) return cachedMetadata;

  try {
    const raw = await fs.readFile(METADATA_PATH, 'utf8');
    cachedMetadata = JSON.parse(raw) as ModelMetadata;
    return cachedMetadata;
  } catch {
    return null;
  }
}

export async function modelExists(): Promise<boolean> {
  try {
    await fs.access(path.join(MODEL_DIR, 'model.json'));
    return true;
  } catch {
    return false;
  }
}

export async function loadModel(): Promise<tfTypes.LayersModel | null> {
  if (cachedModel) return cachedModel;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const exists = await modelExists();
    if (!exists) return null;

    try {
      await resetTensorFlowState();

      const tf = await getTensorFlow();
      cachedModel = await tf.loadLayersModel(createLoadHandler(MODEL_DIR));
      await loadModelMetadata();
      return cachedModel;
    } catch (error) {
      console.error('Failed to load recommendation model:', error);
      await resetTensorFlowState();
      cachedMetadata = null;
      return null;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export function buildDefaultMetadata(
  partial: Omit<ModelMetadata, 'completedOrderStatuses' | 'version'> & { version?: string }
): ModelMetadata {
  return {
    version: partial.version ?? new Date().toISOString(),
    trainedAt: partial.trainedAt,
    trainExamples: partial.trainExamples,
    valExamples: partial.valExamples,
    finalTrainLoss: partial.finalTrainLoss,
    finalValLoss: partial.finalValLoss,
    finalValAccuracy: partial.finalValAccuracy,
    inputDimension: partial.inputDimension,
    epochsRun: partial.epochsRun,
    completedOrderStatuses: [...COMPLETED_ORDER_STATUSES],
  };
}

export async function clearModelCache(): Promise<void> {
  await resetTensorFlowState();
  cachedMetadata = null;
  loadPromise = null;
}

export async function saveModelFromArtifacts(options: {
  modelTopology: object;
  weightSpecs: tfTypes.io.WeightsManifestEntry[];
  weightData: Buffer;
  metadata: ModelMetadata;
}): Promise<void> {
  await resetTensorFlowState();
  cachedMetadata = null;
  loadPromise = null;

  await fs.mkdir(MODEL_DIR, { recursive: true });

  const weightsManifest = [
    {
      paths: ['weights.bin'],
      weights: options.weightSpecs,
    },
  ];

  await fs.writeFile(
    path.join(MODEL_DIR, 'model.json'),
    JSON.stringify(
      {
        modelTopology: options.modelTopology,
        weightsManifest,
        format: 'layers-model',
      },
      null,
      2
    )
  );

  await fs.writeFile(path.join(MODEL_DIR, 'weights.bin'), options.weightData);
  await fs.writeFile(METADATA_PATH, JSON.stringify(options.metadata, null, 2));
  cachedMetadata = options.metadata;
}
