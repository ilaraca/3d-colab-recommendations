import { NextRequest, NextResponse } from 'next/server';
import {
  buildDefaultMetadata,
  saveModelFromArtifacts,
} from '@/lib/recommendations/model-loader';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      modelTopology,
      weightSpecs,
      weightDataBase64,
      trainExamples,
      valExamples,
      finalTrainLoss,
      finalValLoss,
      finalValAccuracy,
      inputDimension,
      epochsRun,
    } = body;

    if (!modelTopology || !weightSpecs || !weightDataBase64) {
      return NextResponse.json({ error: 'Invalid model payload' }, { status: 400 });
    }

    const weightData = Buffer.from(weightDataBase64, 'base64');

    const metadata = buildDefaultMetadata({
      version: `browser-${new Date().toISOString()}`,
      trainedAt: new Date().toISOString(),
      trainExamples: trainExamples ?? 0,
      valExamples: valExamples ?? 0,
      finalTrainLoss: finalTrainLoss ?? 0,
      finalValLoss: finalValLoss ?? 0,
      finalValAccuracy: finalValAccuracy ?? 0,
      inputDimension: inputDimension ?? 0,
      epochsRun: epochsRun ?? 0,
    });

    await saveModelFromArtifacts({
      modelTopology,
      weightSpecs,
      weightData,
      metadata,
    });

    return NextResponse.json({
      success: true,
      message: 'Modelo aplicado ao marketplace',
      metadata,
    });
  } catch (error) {
    console.error('Upload model error:', error);
    return NextResponse.json({ error: 'Failed to save model' }, { status: 500 });
  }
}
