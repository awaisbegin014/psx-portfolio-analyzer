import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';

const validTrades = ['date,symbol,side,quantity,price', '2026-01-01,HBL,BUY,100,100'].join('\n');

const createTestApp = (price = 110) =>
  createApp({
    loadPrices: async () => new Map([['HBL', price]]),
  });

describe('portfolio API', () => {
  it('returns a calculated portfolio for a valid upload', async () => {
    const response = await request(createTestApp())
      .post('/api/portfolio')
      .attach('trades', Buffer.from(validTrades), 'trades.csv')
      .expect(200);

    expect(response.body.data).toMatchObject({
      holdings: [
        {
          symbol: 'HBL',
          quantity: 100,
          averageCost: 100.15,
          currentValue: 11_000,
          unrealisedProfitLoss: 985,
        },
      ],
      totals: {
        costBasis: 10_015,
        currentValue: 11_000,
        unrealisedProfitLoss: 985,
      },
    });
  });

  it('requires a file in the trades field', async () => {
    const response = await request(createTestApp()).post('/api/portfolio').expect(400);
    expect(response.body.error.code).toBe('FILE_REQUIRED');
  });

  it('rejects non-CSV filenames', async () => {
    const response = await request(createTestApp())
      .post('/api/portfolio')
      .attach('trades', Buffer.from(validTrades), 'trades.txt')
      .expect(422);

    expect(response.body.error.code).toBe('INVALID_CSV');
  });

  it('returns row-specific validation errors', async () => {
    const invalidTrades = ['date,symbol,side,quantity,price', 'not-a-date,HBL,BUY,-10,100'].join(
      '\n',
    );
    const response = await request(createTestApp())
      .post('/api/portfolio')
      .attach('trades', Buffer.from(invalidTrades), 'trades.csv')
      .expect(422);

    expect(response.body.error).toMatchObject({
      code: 'INVALID_CSV',
      details: expect.arrayContaining([expect.objectContaining({ rowNumber: 2 })]),
    });
  });

  it('rejects an oversold position', async () => {
    const sellOnly = ['date,symbol,side,quantity,price', '2026-01-01,HBL,SELL,1,100'].join('\n');
    const response = await request(createTestApp())
      .post('/api/portfolio')
      .attach('trades', Buffer.from(sellOnly), 'trades.csv')
      .expect(422);

    expect(response.body.error).toMatchObject({
      code: 'INVALID_PORTFOLIO',
      details: [{ rowNumber: 2 }],
    });
  });

  it('returns a health response and structured 404 errors', async () => {
    await request(createTestApp()).get('/api/health').expect(200, { status: 'ok' });

    const response = await request(createTestApp()).get('/api/unknown').expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
