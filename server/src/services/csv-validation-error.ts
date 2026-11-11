export interface CsvValidationIssue {
  rowNumber?: number;
  field?: string;
  message: string;
}

export class CsvValidationError extends Error {
  constructor(
    message: string,
    readonly issues: CsvValidationIssue[] = [],
  ) {
    super(message);
    this.name = 'CsvValidationError';
  }
}
