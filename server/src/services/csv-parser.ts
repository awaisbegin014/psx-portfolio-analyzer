import { parse } from 'csv-parse/sync';
import { z } from 'zod';

import type { Trade } from '../domain/portfolio.types.js';
import { CsvValidationError, type CsvValidationIssue } from './csv-validation-error.js';

const TRADE_HEADERS = ['date', 'symbol', 'side', 'quantity', 'price'] as const;
const PRICE_HEADERS = ['symbol', 'current_price'] as const;
const MAX_REPORTED_ISSUES = 50;

const isIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const tradeRowSchema = z.object({
  date: z.string().refine(isIsoDate, 'Must be a valid date in YYYY-MM-DD format.'),
  symbol: z
    .string()
    .min(1, 'Symbol is required.')
    .max(20, 'Symbol must be 20 characters or fewer.')
    .regex(/^[A-Z0-9.-]+$/, 'Symbol contains unsupported characters.'),
  side: z.enum(['BUY', 'SELL'], { error: 'Side must be BUY or SELL.' }),
  quantity: z.coerce
    .number()
    .int('Quantity must be an integer.')
    .positive('Quantity must be positive.'),
  price: z.coerce.number().finite().positive('Price must be positive.'),
});

const priceRowSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required.')
    .max(20, 'Symbol must be 20 characters or fewer.')
    .regex(/^[A-Z0-9.-]+$/, 'Symbol contains unsupported characters.'),
  current_price: z.coerce.number().finite().positive('Current price must be positive.'),
});

function parseRows(input: Buffer | string): string[][] {
  try {
    return parse(input.toString(), {
      bom: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: false,
    }) as string[][];
  } catch {
    throw new CsvValidationError('The file is not a valid CSV document.');
  }
}

function validateHeaders(
  rows: string[][],
  requiredHeaders: readonly string[],
): Map<string, number> {
  const headerRow = rows[0];

  if (!headerRow) {
    throw new CsvValidationError('The CSV file is empty.');
  }

  const normalisedHeaders = headerRow.map((header) => header.trim().toLowerCase());
  const uniqueHeaders = new Set(normalisedHeaders);
  const missingHeaders = requiredHeaders.filter((header) => !uniqueHeaders.has(header));
  const unexpectedHeaders = normalisedHeaders.filter((header) => !requiredHeaders.includes(header));

  if (
    uniqueHeaders.size !== normalisedHeaders.length ||
    missingHeaders.length > 0 ||
    unexpectedHeaders.length > 0 ||
    normalisedHeaders.length !== requiredHeaders.length
  ) {
    throw new CsvValidationError(`Expected CSV headers: ${requiredHeaders.join(', ')}.`);
  }

  return new Map(normalisedHeaders.map((header, index) => [header, index]));
}

function valueAt(row: string[], headerIndexes: Map<string, number>, header: string): string {
  const index = headerIndexes.get(header);
  return index === undefined ? '' : (row[index] ?? '').trim();
}

function appendZodIssues(
  issues: CsvValidationIssue[],
  rowNumber: number,
  validationIssues: z.core.$ZodIssue[],
): void {
  for (const issue of validationIssues) {
    if (issues.length >= MAX_REPORTED_ISSUES) {
      return;
    }

    issues.push({
      rowNumber,
      field: issue.path[0]?.toString(),
      message: issue.message,
    });
  }
}

export function parseTradesCsv(input: Buffer | string, maximumRows: number): Trade[] {
  const rows = parseRows(input);
  const headerIndexes = validateHeaders(rows, TRADE_HEADERS);
  const dataRows = rows.slice(1);

  if (dataRows.length === 0) {
    throw new CsvValidationError('The CSV file does not contain any trades.');
  }

  if (dataRows.length > maximumRows) {
    throw new CsvValidationError(`The CSV file exceeds the ${maximumRows} trade row limit.`);
  }

  const trades: Trade[] = [];
  const issues: CsvValidationIssue[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const parsed = tradeRowSchema.safeParse({
      date: valueAt(row, headerIndexes, 'date'),
      symbol: valueAt(row, headerIndexes, 'symbol').toUpperCase(),
      side: valueAt(row, headerIndexes, 'side').toUpperCase(),
      quantity: valueAt(row, headerIndexes, 'quantity'),
      price: valueAt(row, headerIndexes, 'price'),
    });

    if (!parsed.success) {
      appendZodIssues(issues, rowNumber, parsed.error.issues);
      return;
    }

    trades.push({ rowNumber, ...parsed.data });
  });

  if (issues.length > 0) {
    throw new CsvValidationError('One or more trade rows are invalid.', issues);
  }

  return trades;
}

export function parseCurrentPricesCsv(input: Buffer | string): Map<string, number> {
  const rows = parseRows(input);
  const headerIndexes = validateHeaders(rows, PRICE_HEADERS);
  const dataRows = rows.slice(1);

  if (dataRows.length === 0) {
    throw new CsvValidationError('The current prices file does not contain any prices.');
  }

  const prices = new Map<string, number>();
  const issues: CsvValidationIssue[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const parsed = priceRowSchema.safeParse({
      symbol: valueAt(row, headerIndexes, 'symbol').toUpperCase(),
      current_price: valueAt(row, headerIndexes, 'current_price'),
    });

    if (!parsed.success) {
      appendZodIssues(issues, rowNumber, parsed.error.issues);
      return;
    }

    if (prices.has(parsed.data.symbol)) {
      issues.push({
        rowNumber,
        field: 'symbol',
        message: `Duplicate price found for ${parsed.data.symbol}.`,
      });
      return;
    }

    prices.set(parsed.data.symbol, parsed.data.current_price);
  });

  if (issues.length > 0) {
    throw new CsvValidationError('One or more current price rows are invalid.', issues);
  }

  return prices;
}
