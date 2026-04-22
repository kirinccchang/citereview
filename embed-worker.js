// embed-worker.js — off-thread semantic embedding for cite.review
// Runs Transformers.js WASM inference in a background thread so the main UI
// thread stays responsive during "Check memo support" analysis.
import { pipeline, env } from 'https://esm.sh/@xenova/transformers@2.17.2';

env.allowLocalModels = false;

let _pipe = null;

async function getPipeline() {
  if (_pipe) return _pipe;
  _pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  return _pipe;
}

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

function chunkText(text, maxChars = 500, overlap = 100) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + maxChars));
    start += maxChars - overlap;
  }
  return chunks;
}

self.onmessage = async ({ data: { id, queryText, opinionText } }) => {
  try {
    const pipe = await getPipeline();
    const embed = async (t) => Array.from((await pipe(t, { pooling: 'mean', normalize: true })).data);
    const queryVec = await embed(queryText);
    const chunks = chunkText(opinionText, 500, 100);
    let maxSim = 0, bestPassage = null;
    for (const chunk of chunks) {
      const sim = cosineSim(queryVec, await embed(chunk));
      if (sim > maxSim) { maxSim = sim; bestPassage = chunk; }
    }
    self.postMessage({ id, result: bestPassage });
  } catch (e) {
    self.postMessage({ id, error: e.message });
  }
};
