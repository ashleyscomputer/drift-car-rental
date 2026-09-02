/// <reference lib="webworker" />

import { pipeline } from '@huggingface/transformers';

const worker = self as unknown as DedicatedWorkerGlobalScope;
let generator: any = null;

worker.onmessage = async (event: MessageEvent<{ type: string; prompt?: string; history?: Array<{ role: string; content: string }> }>) => {
  if (event.data.type === 'dispose') {
    if (generator?.dispose) await generator.dispose();
    generator = null;
    worker.close();
    return;
  }

  if (event.data.type !== 'generate' || !event.data.prompt) return;

  try {
    if (!generator) {
      worker.postMessage({ type: 'status', value: 'Downloading the compact AI model for first use…' });
      generator = await pipeline('text-generation', 'onnx-community/gemma-3-270m-it-ONNX', {
        dtype: 'q4',
        progress_callback: (progress: { status?: string; progress?: number }) => {
          if (typeof progress.progress === 'number') {
            worker.postMessage({ type: 'progress', value: Math.round(progress.progress) });
          }
        },
      });
    }

    worker.postMessage({ type: 'status', value: 'Thinking on your device…' });
    const messages = [
      {
        role: 'system',
        content: 'You are Drift Guide, a concise and friendly assistant. Answer general-knowledge questions accurately. For car-rental questions, explain that Drift is a database-free university prototype with 40 vehicles, market-aligned indicative from-rates, filters, galleries, demo booking, and an admin dashboard. Never claim a booking or payment is legally confirmed. Keep replies under 120 words.',
      },
      ...(event.data.history ?? []).slice(-6),
      { role: 'user', content: event.data.prompt },
    ];
    const output: any = await generator(messages, { max_new_tokens: 140, temperature: 0.55, do_sample: true });
    const generated = output?.[0]?.generated_text;
    const answer = Array.isArray(generated)
      ? generated.at(-1)?.content
      : typeof generated === 'string'
        ? generated.replace(event.data.prompt, '').trim()
        : '';
    worker.postMessage({ type: 'result', value: answer || 'I could not form a useful answer. Please try asking in a different way.' });
  } catch (error) {
    worker.postMessage({ type: 'error', value: error instanceof Error ? error.message : 'The local AI model could not start.' });
  }
};

