/**
 * TensorFlow.js — usa @tensorflow/tfjs (pure JS, funciona em Node 18+).
 * Para treino mais rápido, instale opcionalmente @tensorflow/tfjs-node
 * e defina TFJS_USE_NODE=1 (não incluído no bundle Next.js).
 */
import * as tfCore from '@tensorflow/tfjs';

let tf: typeof tfCore = tfCore;

const TFJS_NODE_MODULE = '@tensorflow/tfjs-node';

export async function getTensorFlow(): Promise<typeof tfCore> {
  if (process.env.TFJS_USE_NODE === '1') {
    try {
      // Variável evita resolução estática pelo TypeScript/webpack; pacote é opcional
      const tfNode = await import(/* webpackIgnore: true */ TFJS_NODE_MODULE);
      tf = tfNode as unknown as typeof tfCore;
    } catch {
      // fallback para @tensorflow/tfjs
    }
  }
  return tf;
}

export { tf };
