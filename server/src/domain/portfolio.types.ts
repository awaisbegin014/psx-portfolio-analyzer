export type TradeSide = 'BUY' | 'SELL';

export interface Trade {
  rowNumber: number;
  date: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  price: number;
}

export interface HoldingResult {
  symbol: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  costBasis: number;
  currentValue: number;
  unrealisedProfitLoss: number;
  unrealisedProfitLossPercentage: number;
}

export interface PortfolioTotals {
  costBasis: number;
  currentValue: number;
  unrealisedProfitLoss: number;
  unrealisedProfitLossPercentage: number;
}

export interface AnalysisSummary {
  tradeCount: number;
  openPositionCount: number;
  brokerageRate: number;
  totalBrokerage: number;
  realisedProfitLoss: number;
}

export interface PortfolioAnalysis {
  holdings: HoldingResult[];
  totals: PortfolioTotals;
  summary: AnalysisSummary;
}
