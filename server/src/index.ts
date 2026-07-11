import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { buildImportPrompt, cleanAndParseResponse } from './prompt';
import { askGemini } from './gemini';
import type { CrmRecord, ImportResponse, SkippedRecord } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '25', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '3', 10);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '2', 10);

function splitIntoBatches(arr: Record<string, string>[], size: number): Record<string, string>[][] {
  const batches: Record<string, string>[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size));
  }
  return batches;
}

async function processBatch(
  batch: Record<string, string>[],
  batchIndex: number,
  totalBatches: number
) {
  const prompt = buildImportPrompt(batch);
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await askGemini(prompt);
      const result = cleanAndParseResponse(response);
      return result;
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error(`Failed to process batch ${batchIndex + 1}/${totalBatches}`);
}

app.post('/api/import', async (req, res) => {
  try {
    const { rows } = req.body;

    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'Invalid request body. Expected { rows: [...] }' });
    }
    if (rows.length === 0) {
      return res.status(400).json({ error: 'No rows provided' });
    }
    if (rows.length > 5000) {
      return res.status(400).json({ error: 'Too many rows. Maximum is 5000.' });
    }

    const batches = splitIntoBatches(rows, BATCH_SIZE);
    const allImported: CrmRecord[] = [];
    const allSkipped: SkippedRecord[] = [];

    for (let i = 0; i < batches.length; i += CONCURRENCY) {
      const currentBatch = batches.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        currentBatch.map((batch, idx) => processBatch(batch, i + idx, batches.length))
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          allImported.push(...result.value.imported);
          allSkipped.push(...result.value.skipped);
        } else {
          allSkipped.push({
            original_row: {},
            reason: `Batch processing error: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`,
          });
        }
      }
    }

    const response: ImportResponse = {
      imported: allImported,
      skipped: allSkipped,
      totalImported: allImported.length,
      totalSkipped: allSkipped.length,
      totalRows: rows.length,
    };

    return res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
