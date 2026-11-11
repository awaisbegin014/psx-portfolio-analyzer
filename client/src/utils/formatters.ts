const currencyFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-PK', {
  maximumFractionDigits: 0,
});

export const formatCurrency = (value: number): string => currencyFormatter.format(value);

export const formatQuantity = (value: number): string => numberFormatter.format(value);

export const formatPercentage = (value: number): string =>
  `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1_024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1_024).toFixed(1)} KB`;
};
