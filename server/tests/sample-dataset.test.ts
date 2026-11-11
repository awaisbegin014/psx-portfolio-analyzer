import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { calculatePortfolio } from '../src/domain/portfolio-calculator.js';
import { parseCurrentPricesCsv, parseTradesCsv } from '../src/services/csv-parser.js';

describe('supplied sample dataset', () => {
  it('produces the expected holdings and portfolio totals', async () => {
    const [tradesFile, pricesFile] = await Promise.all([
      readFile(new URL('../../samples/trades.csv', import.meta.url)),
      readFile(new URL('../../data/current_prices.csv', import.meta.url)),
    ]);

    const result = calculatePortfolio(
      parseTradesCsv(tradesFile, 10_000),
      parseCurrentPricesCsv(pricesFile),
    );

    expect(result).toEqual({
      holdings: [
        {
          symbol: 'ENGRO',
          quantity: 850,
          averageCost: 328.8072,
          currentPrice: 312.8,
          costBasis: 279_486.1,
          currentValue: 265_880,
          unrealisedProfitLoss: -13_606.1,
          unrealisedProfitLossPercentage: -4.87,
        },
        {
          symbol: 'FFC',
          quantity: 300,
          averageCost: 327.6875,
          currentPrice: 341.2,
          costBasis: 98_306.24,
          currentValue: 102_360,
          unrealisedProfitLoss: 4_053.76,
          unrealisedProfitLossPercentage: 4.12,
        },
        {
          symbol: 'HBL',
          quantity: 100,
          averageCost: 157.0753,
          currentPrice: 172.3,
          costBasis: 15_707.53,
          currentValue: 17_230,
          unrealisedProfitLoss: 1_522.47,
          unrealisedProfitLossPercentage: 9.69,
        },
        {
          symbol: 'LUCK',
          quantity: 50,
          averageCost: 1_036.3222,
          currentPrice: 1_045,
          costBasis: 51_816.11,
          currentValue: 52_250,
          unrealisedProfitLoss: 433.89,
          unrealisedProfitLossPercentage: 0.84,
        },
        {
          symbol: 'MCB',
          quantity: 650,
          averageCost: 257.8562,
          currentPrice: 268.4,
          costBasis: 167_606.53,
          currentValue: 174_460,
          unrealisedProfitLoss: 6_853.47,
          unrealisedProfitLossPercentage: 4.09,
        },
        {
          symbol: 'OGDC',
          quantity: 550,
          averageCost: 207.4513,
          currentPrice: 228.5,
          costBasis: 114_098.23,
          currentValue: 125_675,
          unrealisedProfitLoss: 11_576.77,
          unrealisedProfitLossPercentage: 10.15,
        },
        {
          symbol: 'PSO',
          quantity: 1_100,
          averageCost: 401.2871,
          currentPrice: 398.6,
          costBasis: 441_415.85,
          currentValue: 438_460,
          unrealisedProfitLoss: -2_955.85,
          unrealisedProfitLossPercentage: -0.67,
        },
        {
          symbol: 'SYS',
          quantity: 650,
          averageCost: 606.1016,
          currentPrice: 612.9,
          costBasis: 393_966.06,
          currentValue: 398_385,
          unrealisedProfitLoss: 4_418.94,
          unrealisedProfitLossPercentage: 1.12,
        },
      ],
      totals: {
        costBasis: 1_562_402.65,
        currentValue: 1_574_700,
        unrealisedProfitLoss: 12_297.35,
        unrealisedProfitLossPercentage: 0.79,
      },
      summary: {
        tradeCount: 30,
        openPositionCount: 8,
        brokerageRate: 0.0015,
        totalBrokerage: 3_325.51,
        realisedProfitLoss: -3_454.86,
      },
    });
  });
});
