import { getTensorFlow } from '@/lib/recommendations/tensorflow';
import { trainRecommendationModel } from '@/lib/recommendations/model';
import {
  buildDefaultMetadata,
  saveModel,
} from '@/lib/recommendations/model-loader';
import { loadTrainingDataFromPrisma } from '@/lib/recommendations/queries';
import { createTrainingData, splitByUser } from '@/lib/recommendations/training-data';

async function main() {
  console.log('Loading training data from database...');
  const { users, products, context } = await loadTrainingDataFromPrisma();

  if (users.length === 0) {
    console.error('No users with purchase history found. Run npm run seed first.');
    process.exit(1);
  }

  if (products.length === 0) {
    console.error('No available products found.');
    process.exit(1);
  }

  const { examples, inputDim } = createTrainingData(users, products, context);
  const { train, val } = splitByUser(examples);

  if (train.length === 0 || val.length === 0) {
    console.error(
      `Insufficient data for train/val split (train=${train.length}, val=${val.length}). Need more users with purchases.`
    );
    process.exit(1);
  }

  console.log(
    `Training with ${train.length} examples (${val.length} validation) · inputDim=${inputDim}`
  );

  const tf = await getTensorFlow();
  const trainXs = tf.tensor2d(train.map((example) => example.input));
  const trainYs = tf.tensor2d(train.map((example) => [example.label]));
  const valXs = tf.tensor2d(val.map((example) => example.input));
  const valYs = tf.tensor2d(val.map((example) => [example.label]));

  const result = await trainRecommendationModel({
    trainXs,
    trainYs,
    valXs,
    valYs,
    onEpochEnd: (epoch, logs) => {
      const loss = logs.loss?.toFixed(4) ?? 'n/a';
      const valLoss = logs.val_loss?.toFixed(4) ?? 'n/a';
      const valAcc = logs.val_acc?.toFixed(4) ?? logs.val_accuracy?.toFixed(4) ?? 'n/a';
      console.log(`Epoch ${epoch + 1}: loss=${loss} val_loss=${valLoss} val_acc=${valAcc}`);
    },
  });

  const metadata = buildDefaultMetadata({
    trainedAt: new Date().toISOString(),
    trainExamples: train.length,
    valExamples: val.length,
    finalTrainLoss: result.finalTrainLoss,
    finalValLoss: result.finalValLoss,
    finalValAccuracy: result.finalValAccuracy,
    inputDimension: inputDim,
    epochsRun: result.epochsRun,
  });

  await saveModel(result.model, metadata);

  trainXs.dispose();
  trainYs.dispose();
  valXs.dispose();
  valYs.dispose();
  result.model.dispose();

  console.log('\nModel saved to models/recommendations/');
  console.log(`Final val_loss=${result.finalValLoss.toFixed(4)} val_acc=${result.finalValAccuracy.toFixed(4)}`);
}

main().catch((error) => {
  console.error('Training failed:', error);
  process.exit(1);
});
