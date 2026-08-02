/**
 * TensorFlow.js — usa @tensorflow/tfjs (pure JS, funciona em Node 18+).
 * Para treino mais rápido, instale opcionalmente @tensorflow/tfjs-node
 * e defina TFJS_USE_NODE=1 (não incluído no bundle Next.js).
 */
import * as tfCore from '@tensorflow/tfjs';

let tf: typeof tfCore = tfCore;

export async function getTensorFlow(): Promise<typeof tfCore> {
  if (process.env.TFJS_USE_NODE === '1') {
    try {
      // webpackIgnore evita que o Next.js tente resolver o pacote opcional no build
      const tfNode = await import(
        /* webpackIgnore: true */ '@tensorflow/tfjs-node'
      );
      tf = tfNode as unknown as typeof tfCore;
    } catch {
      // fallback para @tensorflow/tfjs
    }
  }
  return tf;
}

export { tf };
