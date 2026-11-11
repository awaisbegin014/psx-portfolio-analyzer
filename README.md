# PSX Portfolio Analyzer

A full-stack application that calculates current PSX portfolio holdings from a CSV trade history. It reports the quantity held, weighted average cost, current value, and unrealised profit or loss for each open position.

**Live application:** https://psx-portfolio-analyzer.vercel.app

## Overview

The browser sends `trades.csv` to the Node.js API. The API validates every row, processes trades in date order, applies 0.15% brokerage, and values open positions using the server-owned `current_prices.csv` file. Uploaded files are processed in memory and are not persisted.

```text
React client
    │  multipart/form-data
    ▼
Express API ──► CSV validation ──► Portfolio calculator
                                           │
                                           ▼
                                  current_prices.csv
```

## Technology choices

| Tool                             | Purpose                                                                     |
| -------------------------------- | --------------------------------------------------------------------------- |
| React, TypeScript, Vite          | Small, strongly typed client with a fast build and minimal runtime overhead |
| Node.js and Express              | Focused HTTP API and production static-file server                          |
| Decimal.js                       | Decimal arithmetic for brokerage and cost-basis calculations                |
| Zod and csv-parse                | Explicit runtime validation and standards-compliant CSV parsing             |
| Multer                           | Size-limited, in-memory multipart uploads                                   |
| Vitest and Supertest             | Domain tests, regression coverage, and API integration tests                |
| ESLint, Prettier, GitHub Actions | Consistent source and automated quality checks                              |

The project intentionally does not use a database, authentication, Redux, or a UI framework because none is required for this calculation-focused task.

## Project structure

```text
client/                 React application
server/src/domain/      Portfolio calculation rules
server/src/services/    CSV parsing and current-price loading
server/src/routes/      Upload API
server/tests/           Unit, integration, and regression tests
data/                   Server-owned current prices
samples/                Example trades file
```

## Running locally

Requires Node.js 20.19 or later.

```bash
npm ci
npm run dev
```

The React client runs at `http://localhost:5173` and proxies API requests to `http://localhost:4000`.

To run the production build locally:

```bash
npm run build
npm start
```

Express then serves both the application and API at `http://localhost:4000`.

## CSV formats

Trade uploads require these columns. Column order is flexible, but names must match exactly.

```csv
date,symbol,side,quantity,price
2026-09-03,ENGRO,BUY,200,315.99
```

Current prices are loaded from `data/current_prices.csv`:

```csv
symbol,current_price
ENGRO,312.8
```

Dates use `YYYY-MM-DD`, sides are `BUY` or `SELL`, quantities are positive integers, and prices must be positive numbers.

## Calculation method

Trades are processed by date, preserving CSV row order when two trades share a date.

### Purchases

```text
trade value      = quantity × price
brokerage        = trade value × 0.0015
acquisition cost = trade value + brokerage

new cost basis   = existing cost basis + acquisition cost
average cost     = new cost basis ÷ new quantity
```

Purchase brokerage is capitalised into the position, so it is included in average cost.

### Sales

```text
removed cost basis  = sold quantity × existing average cost
remaining cost basis = existing cost basis − removed cost basis
```

A partial sale does not change the average cost of the remaining shares. Sell brokerage is deducted from sale proceeds when calculating realised P/L internally; it does not alter the cost basis of shares still held. A fully closed position resets to zero, and a later purchase starts a new cost basis.

### Current valuation

```text
current value      = quantity held × current price
unrealised P/L     = current value − remaining cost basis
unrealised P/L (%) = unrealised P/L ÷ remaining cost basis × 100
```

Calculations retain decimal precision throughout and are rounded only when producing the API response.

## API

### `POST /api/portfolio`

Accepts one file in the `trades` multipart field and returns:

- open holdings with quantity, average cost, current value, and unrealised P/L;
- portfolio cost basis, current value, and total unrealised P/L;
- processing metadata including trade count and total brokerage.

### `GET /api/health`

Returns a small health response for deployment monitoring.

Validation errors use a consistent JSON structure and include CSV row and field details where available. The server rejects malformed files, missing headers, invalid dates, non-positive values, duplicate prices, unknown current prices, and sales above the available quantity.

## Sample result

The supplied dataset is locked into a regression test. Its expected portfolio totals are:

| Metric         |            Value |
| -------------- | ---------------: |
| Open positions |                8 |
| Cost basis     | PKR 1,562,402.65 |
| Current value  | PKR 1,574,700.00 |
| Unrealised P/L |    PKR 12,297.35 |
| Unrealised P/L |            0.79% |

## Quality checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

The test suite covers brokerage, weighted-average purchases, partial and complete sales, repurchases, invalid CSV data, overselling, missing prices, API uploads, and the complete supplied sample dataset.

## Deployment

Two deployment targets are included:

- **Vercel:** `vercel.json` runs the Vercel-specific build, emits the React client to `public/`, and deploys explicit functions from `api/` that reuse the Express application.
- **Render:** `render.yaml` defines a single web service where Express serves both the compiled React client and `/api` routes. `/api/health` is configured as the health check.

Both options keep the frontend and API on one origin, so no production CORS configuration is required.
