import { describe, expect, it } from 'vitest';

import { CsvValidationError } from '../src/services/csv-validation-error.js';
import { parseCurrentPricesCsv, parseTradesCsv } from '../src/services/csv-parser.js';

describe('parseTradesCsv', () => {
  it('parses valid rows and normalises symbols and sides', () => {
    const csv = ['symbol,date,quantity,price,side', 'hbl,2026-01-02,10,150.25,buy'].join('\n');

    expect(parseTradesCsv(csv, 100)).toEqual([
      {
        rowNumber: 2,
        date: '2026-01-02',
        symbol: 'HBL',
        side: 'BUY',
        quantity: 10,
        price: 150.25,
      },
    ]);
  });

  it('reports row-level validation issues', () => {
    const csv = ['date,symbol,side,quantity,price', '2026-02-30,HBL,HOLD,-2,abc'].join('\n');

    expect.assertions(2);

    try {
      parseTradesCsv(csv, 100);
    } catch (error) {
      expect(error).toBeInstanceOf(CsvValidationError);
      expect(error).toMatchObject({
        issues: expect.arrayContaining([
          expect.objectContaining({ rowNumber: 2, field: 'date' }),
          expect.objectContaining({ rowNumber: 2, field: 'side' }),
          expect.objectContaining({ rowNumber: 2, field: 'quantity' }),
          expect.objectContaining({ rowNumber: 2, field: 'price' }),
        ]),
      });
    }
  });

  it('rejects an unexpected header set', () => {
    expect(() => parseTradesCsv('date,symbol,side,quantity\n', 100)).toThrow(
      'Expected CSV headers: date, symbol, side, quantity, price.',
    );
  });
});

describe('parseCurrentPricesCsv', () => {
  it('parses current prices', () => {
    expect(parseCurrentPricesCsv('symbol,current_price\nOGDC,228.5')).toEqual(
      new Map([['OGDC', 228.5]]),
    );
  });

  it('rejects duplicate symbols', () => {
    const csv = ['symbol,current_price', 'OGDC,228.5', 'OGDC,230'].join('\n');
    expect(() => parseCurrentPricesCsv(csv)).toThrow('One or more current price rows are invalid.');
  });
});
