export class PortfolioCalculationError extends Error {
  constructor(
    message: string,
    readonly rowNumber?: number,
  ) {
    super(message);
    this.name = 'PortfolioCalculationError';
  }
}
