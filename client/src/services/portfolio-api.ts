import type { PortfolioAnalysis, ValidationIssue } from '../types/portfolio';

interface ApiErrorResponse {
  error?: {
    message?: string;
    details?: ValidationIssue[];
  };
}

interface PortfolioResponse {
  data: PortfolioAnalysis;
}

export interface PortfolioApiError extends Error {
  details?: ValidationIssue[];
}

export async function analyzePortfolio(file: File): Promise<PortfolioAnalysis> {
  const formData = new FormData();
  formData.append('trades', file);

  let response: Response;

  try {
    response = await fetch('/api/portfolio', {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw Object.assign(new Error('The service is unavailable. Check your connection and retry.'), {
      details: [],
    });
  }

  const body = (await response.json().catch(() => ({}))) as ApiErrorResponse & PortfolioResponse;

  if (!response.ok) {
    throw Object.assign(
      new Error(body.error?.message ?? 'The portfolio could not be analysed. Please try again.'),
      { details: body.error?.details ?? [] },
    );
  }

  return body.data;
}
