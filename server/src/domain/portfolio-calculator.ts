import { Decimal } from 'decimal.js';

import { PortfolioCalculationError } from './portfolio-error.js';
import type {
  HoldingResult,
  PortfolioAnalysis,
  PortfolioTotals,
  Trade,
} from './portfolio.types.js';

export const BROKERAGE_RATE = new Decimal(0.0015);

interface Position {
  quantity: Decimal;
  costBasis: Decimal;
}

interface PreciseHolding {
  result: HoldingResult;
  costBasis: Decimal;
  currentValue: Decimal;
  unrealisedProfitLoss: Decimal;
}

function round(value: Decimal, decimalPlaces: number): number {
  return value.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP).toNumber();
}

function percentage(numerator: Decimal, denominator: Decimal): Decimal {
  return denominator.isZero() ? new Decimal(0) : numerator.dividedBy(denominator).times(100);
}

function createHolding(symbol: string, position: Position, currentPrice: Decimal): PreciseHolding {
  const averageCost = position.costBasis.dividedBy(position.quantity);
  const currentValue = position.quantity.times(currentPrice);
  const unrealisedProfitLoss = currentValue.minus(position.costBasis);

  return {
    result: {
      symbol,
      quantity: position.quantity.toNumber(),
      averageCost: round(averageCost, 4),
      currentPrice: round(currentPrice, 4),
      costBasis: round(position.costBasis, 2),
      currentValue: round(currentValue, 2),
      unrealisedProfitLoss: round(unrealisedProfitLoss, 2),
      unrealisedProfitLossPercentage: round(
        percentage(unrealisedProfitLoss, position.costBasis),
        2,
      ),
    },
    costBasis: position.costBasis,
    currentValue,
    unrealisedProfitLoss,
  };
}

function createTotals(holdings: PreciseHolding[]): PortfolioTotals {
  const totals = holdings.reduce(
    (accumulator, holding) => ({
      costBasis: accumulator.costBasis.plus(holding.costBasis),
      currentValue: accumulator.currentValue.plus(holding.currentValue),
      unrealisedProfitLoss: accumulator.unrealisedProfitLoss.plus(holding.unrealisedProfitLoss),
    }),
    {
      costBasis: new Decimal(0),
      currentValue: new Decimal(0),
      unrealisedProfitLoss: new Decimal(0),
    },
  );

  return {
    costBasis: round(totals.costBasis, 2),
    currentValue: round(totals.currentValue, 2),
    unrealisedProfitLoss: round(totals.unrealisedProfitLoss, 2),
    unrealisedProfitLossPercentage: round(
      percentage(totals.unrealisedProfitLoss, totals.costBasis),
      2,
    ),
  };
}

export function calculatePortfolio(
  trades: readonly Trade[],
  currentPrices: ReadonlyMap<string, Decimal.Value>,
): PortfolioAnalysis {
  const positions = new Map<string, Position>();
  let totalBrokerage = new Decimal(0);
  let realisedProfitLoss = new Decimal(0);

  const orderedTrades = trades
    .map((trade, originalIndex) => ({ trade, originalIndex }))
    .sort(
      (left, right) =>
        left.trade.date.localeCompare(right.trade.date) || left.originalIndex - right.originalIndex,
    );

  for (const { trade } of orderedTrades) {
    const quantity = new Decimal(trade.quantity);
    const price = new Decimal(trade.price);
    const tradeValue = quantity.times(price);
    const brokerage = tradeValue.times(BROKERAGE_RATE);
    const position = positions.get(trade.symbol) ?? {
      quantity: new Decimal(0),
      costBasis: new Decimal(0),
    };

    totalBrokerage = totalBrokerage.plus(brokerage);

    if (trade.side === 'BUY') {
      position.quantity = position.quantity.plus(quantity);
      position.costBasis = position.costBasis.plus(tradeValue).plus(brokerage);
      positions.set(trade.symbol, position);
      continue;
    }

    if (quantity.greaterThan(position.quantity)) {
      throw new PortfolioCalculationError(
        `Cannot sell ${trade.quantity} ${trade.symbol} shares; only ${position.quantity.toString()} are available.`,
        trade.rowNumber,
      );
    }

    const averageCost = position.costBasis.dividedBy(position.quantity);
    const removedCostBasis = averageCost.times(quantity);
    const netSaleProceeds = tradeValue.minus(brokerage);

    realisedProfitLoss = realisedProfitLoss.plus(netSaleProceeds.minus(removedCostBasis));
    position.quantity = position.quantity.minus(quantity);
    position.costBasis = position.costBasis.minus(removedCostBasis);

    if (position.quantity.isZero()) {
      position.costBasis = new Decimal(0);
    }

    positions.set(trade.symbol, position);
  }

  const preciseHoldings = [...positions.entries()]
    .filter(([, position]) => position.quantity.greaterThan(0))
    .sort(([leftSymbol], [rightSymbol]) => leftSymbol.localeCompare(rightSymbol))
    .map(([symbol, position]) => {
      const rawCurrentPrice = currentPrices.get(symbol);

      if (rawCurrentPrice === undefined) {
        throw new PortfolioCalculationError(`No current price is available for ${symbol}.`);
      }

      return createHolding(symbol, position, new Decimal(rawCurrentPrice));
    });

  return {
    holdings: preciseHoldings.map(({ result }) => result),
    totals: createTotals(preciseHoldings),
    summary: {
      tradeCount: trades.length,
      openPositionCount: preciseHoldings.length,
      brokerageRate: BROKERAGE_RATE.toNumber(),
      totalBrokerage: round(totalBrokerage, 2),
      realisedProfitLoss: round(realisedProfitLoss, 2),
    },
  };
}
