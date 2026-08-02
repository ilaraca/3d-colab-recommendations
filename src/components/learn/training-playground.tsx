'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LossChart } from '@/components/learn/charts';
import { ConceptPanel } from '@/components/learn/concept-panel';
import { FeatureTooltip } from '@/components/learn/feature-tooltip';
import { GlossaryLabel } from '@/components/learn/glossary-label';
import { TRAINING_CONCEPTS } from '@/lib/recommendations/lab-concepts';
import { trainInBrowser, uploadModelToServer, type EpochLog } from '@/lib/recommendations/browser-model';
import type * as tfTypes from '@tensorflow/tfjs';
import { Brain, Loader2, Upload } from 'lucide-react';

interface DatasetResponse {
  inputDim: number;
  stats: {
    trainExamples: number;
    valExamples: number;
    positiveLabels: number;
    negativeLabels: number;
  };
  train: Array<{ input: number[]; label: number }>;
  val: Array<{ input: number[]; label: number }>;
}

interface TrainingPlaygroundProps {
  onMissionComplete?: (missionId: string) => void;
}

export function TrainingPlayground({ onMissionComplete }: TrainingPlaygroundProps) {
  const [dataset, setDataset] = useState<DatasetResponse | null>(null);
  const [epochs, setEpochs] = useState(30);
  const [learningRate, setLearningRate] = useState(0.01);
  const [training, setTraining] = useState(false);
  const [logs, setLogs] = useState<EpochLog[]>([]);
  const [result, setResult] = useState<{
    finalTrainLoss: number;
    finalValLoss: number;
    finalValAcc: number;
    epochsRun: number;
  } | null>(null);
  const [trainedModel, setTrainedModel] = useState<tfTypes.LayersModel | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/learn/dataset')
      .then((response) => response.json())
      .then(setDataset)
      .catch(() => setError('Não foi possível carregar o dataset.'));
  }, []);

  async function handleTrain() {
    if (!dataset) return;

    setTraining(true);
    setError(null);
    setLogs([]);
    setResult(null);
    setUploadSuccess(false);
    if (trainedModel) {
      trainedModel.dispose();
      setTrainedModel(null);
    }

    const epochLogs: EpochLog[] = [];

    try {
      const trainResult = await trainInBrowser({
        trainXs: dataset.train.map((example) => example.input),
        trainYs: dataset.train.map((example) => example.label),
        valXs: dataset.val.map((example) => example.input),
        valYs: dataset.val.map((example) => example.label),
        epochs,
        learningRate,
        onEpochEnd: (log) => {
          epochLogs.push(log);
          setLogs([...epochLogs]);
        },
      });

      setResult({
        finalTrainLoss: trainResult.finalTrainLoss,
        finalValLoss: trainResult.finalValLoss,
        finalValAcc: trainResult.finalValAcc,
        epochsRun: trainResult.epochsRun,
      });
      setTrainedModel(trainResult.model);
      onMissionComplete?.('train_model');
      if (epochs >= 50) onMissionComplete?.('spot_overfit');
    } catch (trainError) {
      console.error(trainError);
      setError('Erro durante o treino. Verifique o console.');
    } finally {
      setTraining(false);
    }
  }

  async function handleUpload() {
    if (!trainedModel || !dataset || !result) return;

    setUploading(true);
    setError(null);

    try {
      await uploadModelToServer({
        model: trainedModel,
        trainExamples: dataset.stats.trainExamples,
        valExamples: dataset.stats.valExamples,
        finalTrainLoss: result.finalTrainLoss,
        finalValLoss: result.finalValLoss,
        finalValAccuracy: result.finalValAcc,
        inputDimension: dataset.inputDim,
        epochsRun: result.epochsRun,
      });
      setUploadSuccess(true);
      onMissionComplete?.('apply_marketplace');
    } catch (uploadError) {
      console.error(uploadError);
      setError(uploadError instanceof Error ? uploadError.message : 'Falha ao aplicar modelo');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            2. Treine no browser
          </CardTitle>
          <CardDescription>
            Treine no browser a mesma arquitetura ML usada pelo recomendador —{' '}
            <FeatureTooltip
              label="leave-one-out"
              description="Ao montar o perfil do usuário para um par de treino, exclui o produto sendo rotulado — evita vazamento de informação."
            />{' '}
            e{' '}
            <FeatureTooltip
              label="binary crossentropy"
              description="Função de perda para classificação binária (comprou / não comprou)."
            />
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {dataset ? (
            <div className="grid grid-cols-2 gap-2 text-sm overflow-visible">
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-muted-foreground">
                  <GlossaryLabel term="Treino" glossaryKey="treino" />
                </p>
                <p className="font-semibold">{dataset.stats.trainExamples} pares</p>
              </div>
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-muted-foreground">
                  <GlossaryLabel term="Validação" glossaryKey="validação" />
                </p>
                <p className="font-semibold">{dataset.stats.valExamples} pares</p>
              </div>
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-muted-foreground">
                  <GlossaryLabel term="Positivos" glossaryKey="positivos" />
                </p>
                <p className="font-semibold">{dataset.stats.positiveLabels}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-muted-foreground">
                  <GlossaryLabel term="Input dim" glossaryKey="input dim" />
                </p>
                <p className="font-semibold">{dataset.inputDim}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="epochs">
                <GlossaryLabel term="Épocas" glossaryKey="épocas" />: {epochs}
              </Label>
              <input
                id="epochs"
                type="range"
                min={5}
                max={80}
                step={5}
                value={epochs}
                onChange={(event) => setEpochs(Number(event.target.value))}
                className="w-full mt-2"
                disabled={training}
              />
            </div>
            <div>
              <Label htmlFor="lr">
                <GlossaryLabel term="Learning rate" glossaryKey="learning rate" />:{' '}
                {learningRate.toFixed(3)}
              </Label>
              <input
                id="lr"
                type="range"
                min={0.001}
                max={0.05}
                step={0.001}
                value={learningRate}
                onChange={(event) => setLearningRate(Number(event.target.value))}
                className="w-full mt-2"
                disabled={training}
              />
            </div>
          </div>

          <div className="rounded-lg border p-3 text-xs font-mono text-muted-foreground">
            Dense(64,{' '}
            <FeatureTooltip label="relu" description="Ativação que zera valores negativos. Permite aprender relações não-lineares." />
            ) → Dropout(0.2) → Dense(32,{' '}
            <FeatureTooltip label="relu" description="Ativação que zera valores negativos. Permite aprender relações não-lineares." />
            ) → Dense(1,{' '}
            <FeatureTooltip label="sigmoid" description="Comprime a saída entre 0 e 1 — probabilidade de compra." />
            )
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            <FeatureTooltip
              label="Dropout"
              description="Desliga 20% dos neurônios aleatoriamente a cada passo — reduz overfit."
            />{' '}
            entre as camadas densas.
          </p>

          <Button onClick={handleTrain} disabled={training || !dataset} className="w-full">
            {training ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Treinando...
              </>
            ) : (
              'Treinar no browser'
            )}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {result && (
            <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
              <p>
                <strong>Épocas:</strong> {result.epochsRun}
              </p>
              <p>
                <strong>
                  <GlossaryLabel term="val_loss" glossaryKey="val_loss" />:
                </strong>{' '}
                {result.finalValLoss.toFixed(4)}
              </p>
              <p>
                <strong>
                  <GlossaryLabel term="val_acc" glossaryKey="val_acc" />:
                </strong>{' '}
                {(result.finalValAcc * 100).toFixed(1)}%
              </p>
              {result.finalValLoss > 0.7 && result.epochsRun >= 10 && (
                <Badge variant="secondary" className="mt-2">
                  val_loss subindo? Pode ser overfit — compare com menos épocas
                </Badge>
              )}
              {trainedModel && (
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  variant="secondary"
                  className="w-full mt-3 gap-2"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Aplicar no marketplace
                </Button>
              )}
              {uploadSuccess && (
                <p className="text-sm text-primary mt-2">
                  Modelo salvo! Use o toggle ML no marketplace ou compare em Ambos.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Curva de loss</CardTitle>
          <CardDescription>
            Se{' '}
            <GlossaryLabel term="val_loss" glossaryKey="val_loss" /> diverge do loss, o modelo
            está memorizando — típico com poucos dados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LossChart logs={logs} />
        </CardContent>
      </Card>
      </div>
      <ConceptPanel
        sections={TRAINING_CONCEPTS}
        title="Interprete o experimento"
        description="Consulte arquitetura, métricas, overfit e persistência após observar o treino."
      />
    </div>
  );
}
