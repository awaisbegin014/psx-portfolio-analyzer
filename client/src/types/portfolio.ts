export interface Holding {
  symbol: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  costBasis: number;
  currentValue: number;
  unrealisedProfitLoss: number;
  unrealisedProfitLossPercentage: number;
}

export interface PortfolioAnalysis {
  holdings: Holding[];
  totals: {
    costBasis: number;
    currentValue: number;
    unrealisedProfitLoss: number;
    unrealisedProfitLossPercentage: number;
  };
  summary: {
    tradeCount: number;
    openPositionCount: number;
    brokerageRate: number;
    totalBrokerage: number;
    realisedProfitLoss: number;
  };
}

export interface ValidationIssue {
  rowNumber?: number;
  field?: string;
  message: string;
}
