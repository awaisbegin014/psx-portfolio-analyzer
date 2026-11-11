import type { PortfolioAnalysis } from '../types/portfolio';
import { formatCurrency, formatPercentage, formatQuantity } from '../utils/formatters';

interface HoldingsTableProps {
  analysis: PortfolioAnalysis;
}

const toneFor = (value: number): string =>
  value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';

export function HoldingsTable({ analysis }: HoldingsTableProps) {
  return (
    <div className="table-card">
      <div className="table-title">
        <div>
          <h3>Holdings</h3>
          <p>Current positions valued against the supplied latest prices.</p>
        </div>
        <span>Currency: PKR</span>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Symbol</th>
              <th scope="col" className="numeric-cell">
                Quantity
              </th>
              <th scope="col" className="numeric-cell">
                Average cost
              </th>
              <th scope="col" className="numeric-cell">
                Current price
              </th>
              <th scope="col" className="numeric-cell">
                Cost basis
              </th>
              <th scope="col" className="numeric-cell">
                Current value
              </th>
              <th scope="col" className="numeric-cell">
                Unrealised P/L
              </th>
            </tr>
          </thead>
          <tbody>
            {analysis.holdings.map((holding) => (
              <tr key={holding.symbol}>
                <th scope="row">
                  <span className="symbol-cell">{holding.symbol}</span>
                </th>
                <td className="numeric-cell">{formatQuantity(holding.quantity)}</td>
                <td className="numeric-cell">{formatCurrency(holding.averageCost)}</td>
                <td className="numeric-cell">{formatCurrency(holding.currentPrice)}</td>
                <td className="numeric-cell">{formatCurrency(holding.costBasis)}</td>
                <td className="numeric-cell cell-emphasis">
                  {formatCurrency(holding.currentValue)}
                </td>
                <td
                  className={`numeric-cell performance-cell ${toneFor(holding.unrealisedProfitLoss)}`}
                >
                  <strong>{formatCurrency(holding.unrealisedProfitLoss)}</strong>
                  <span>{formatPercentage(holding.unrealisedProfitLossPercentage)}</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Portfolio total</th>
              <td colSpan={3} />
              <td className="numeric-cell">{formatCurrency(analysis.totals.costBasis)}</td>
              <td className="numeric-cell">{formatCurrency(analysis.totals.currentValue)}</td>
              <td
                className={`numeric-cell performance-cell ${toneFor(analysis.totals.unrealisedProfitLoss)}`}
              >
                <strong>{formatCurrency(analysis.totals.unrealisedProfitLoss)}</strong>
                <span>{formatPercentage(analysis.totals.unrealisedProfitLossPercentage)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
