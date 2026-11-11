import type { PortfolioAnalysis } from '../types/portfolio';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface PortfolioSummaryProps {
  analysis: PortfolioAnalysis;
}

export function PortfolioSummary({ analysis }: PortfolioSummaryProps) {
  const profitLossTone =
    analysis.totals.unrealisedProfitLoss > 0
      ? 'positive'
      : analysis.totals.unrealisedProfitLoss < 0
        ? 'negative'
        : 'neutral';

  return (
    <div className="summary-grid">
      <article className="summary-card primary-summary">
        <p>Current value</p>
        <strong>{formatCurrency(analysis.totals.currentValue)}</strong>
        <span>Across {analysis.summary.openPositionCount} open positions</span>
      </article>
      <article className="summary-card">
        <p>Total cost basis</p>
        <strong>{formatCurrency(analysis.totals.costBasis)}</strong>
        <span>Purchase brokerage included</span>
      </article>
      <article className="summary-card">
        <p>Unrealised P/L</p>
        <div className={`summary-performance ${profitLossTone}`}>
          <strong>{formatCurrency(analysis.totals.unrealisedProfitLoss)}</strong>
          <span>{formatPercentage(analysis.totals.unrealisedProfitLossPercentage)}</span>
        </div>
        <small>Total brokerage paid: {formatCurrency(analysis.summary.totalBrokerage)}</small>
      </article>
    </div>
  );
}
