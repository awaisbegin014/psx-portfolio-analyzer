import { readFile } from 'node:fs/promises';

import { parseCurrentPricesCsv } from './csv-parser.js';

const currentPricesPath = new URL('../../../data/current_prices.csv', import.meta.url);

let cachedPrices: ReadonlyMap<string, number> | undefined;

export async function loadCurrentPrices(): Promise<ReadonlyMap<string, number>> {
  if (!cachedPrices) {
    const file = await readFile(currentPricesPath);
    cachedPrices = parseCurrentPricesCsv(file);
  }

  return cachedPrices;
}
