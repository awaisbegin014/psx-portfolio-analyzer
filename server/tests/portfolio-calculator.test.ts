import { describe, expect, it } from 'vitest';

import { calculatePortfolio } from '../src/domain/portfolio-calculator.js';
import { PortfolioCalculationError } from '../src/domain/portfolio-error.js';
import type { Trade } from '../src/domain/portfolio.types.js';

const prices = (values: Record<string, number>) => new Map(Object.entries(values));

const trade = (overrides: Partial<Trade> = {}): Trade => ({
  rowNumber: 2,
  date: '2026-01-01',
  symbol: 'TEST',
  side: 'BUY',
  quantity: 100,
  price: 100,
  ...overrides,
});

describe('calculatePortfolio', () => {
  it('capitalises buy brokerage into average cost', () => {
    const result = calculatePortfolio([trade()], prices({ TEST: 110 }));

    expect(result.holdings).toEqual([
      {
        symbol: 'TEST',
        quantity: 100,
        averageCost: 100.15,
        currentPrice: 110,
        costBasis: 10_015,
        currentValue: 11_000,
        unrealisedProfitLoss: 985,
        unrealisedProfitLossPercentage: 9.84,
      },
    ]);
    expect(result.summary.totalBrokerage).toBe(15);
  });

  it('preserves weighted average cost after a partial sale', () => {
    const result = calculatePortfolio(
      [
        trade(),
        trade({ rowNumber: 3, date: '2026-01-02', price: 200 }),
        trade({
          rowNumber: 4,
          date: '2026-01-03',
          side: 'SELL',
          quantity: 50,
          price: 180,
        }),
      ],
      prices({ TEST: 160 }),
    );

    expect(result.holdings[0]).toMatchObject({
      quantity: 150,
      averageCost: 150.225,
      costBasis: 22_533.75,
      currentValue: 24_000,
      unrealisedProfitLoss: 1_466.25,
      unrealisedProfitLossPercentage: 6.51,
    });
    expect(result.summary).toMatchObject({
      totalBrokerage: 58.5,
      realisedProfitLoss: 1_475.25,
    });
  });

  it('resets cost basis after a full exit and starts fresh on repurchase', () => {
    const result = calculatePortfolio(
      [
        trade({ quantity: 10 }),
        trade({ rowNumber: 3, date: '2026-01-02', side: 'SELL', quantity: 10, price: 110 }),
        trade({ rowNumber: 4, date: '2026-01-03', quantity: 5, price: 200 }),
      ],
      prices({ TEST: 210 }),
    );

    expect(result.holdings[0]).toMatchObject({
      quantity: 5,
      averageCost: 200.3,
      costBasis: 1_001.5,
    });
    expect(result.summary.realisedProfitLoss).toBe(96.85);
  });

  it('processes same-day trades in their original CSV order', () => {
    const result = calculatePortfolio(
      [trade({ quantity: 10 }), trade({ rowNumber: 3, side: 'SELL', quantity: 5, price: 105 })],
      prices({ TEST: 105 }),
    );

    expect(result.holdings[0]?.quantity).toBe(5);
  });

  it('rejects a sale that exceeds the available position', () => {
    expect(() =>
      calculatePortfolio([trade({ side: 'SELL', quantity: 1 })], prices({ TEST: 100 })),
    ).toThrowError(PortfolioCalculationError);

    try {
      calculatePortfolio(
        [trade({ rowNumber: 7, side: 'SELL', quantity: 1 })],
        prices({ TEST: 100 }),
      );
    } catch (error) {
      expect(error).toMatchObject({ rowNumber: 7 });
    }
  });

  it('requires a current price only for open positions', () => {
    expect(() => calculatePortfolio([trade()], prices({}))).toThrow(
      'No current price is available for TEST.',
    );

    const result = calculatePortfolio(
      [trade({ quantity: 10 }), trade({ side: 'SELL', quantity: 10 })],
      prices({}),
    );

    expect(result.holdings).toEqual([]);
    expect(result.totals).toEqual({
      costBasis: 0,
      currentValue: 0,
      unrealisedProfitLoss: 0,
      unrealisedProfitLossPercentage: 0,
    });
  });
});
