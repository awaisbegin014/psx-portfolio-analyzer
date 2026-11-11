import type { PortfolioApiError } from '../services/portfolio-api';

interface ValidationMessageProps {
  error: PortfolioApiError | null;
}

export function ValidationMessage({ error }: ValidationMessageProps) {
  if (!error) {
    return null;
  }

  const details = error.details?.slice(0, 5) ?? [];

  return (
    <div className="validation-message" role="alert" aria-live="polite">
      <div className="validation-icon" aria-hidden="true">
        !
      </div>
      <div>
        <strong>We could not process this file</strong>
        <p>{error.message}</p>
        {details.length > 0 && (
          <ul>
            {details.map((detail, index) => (
              <li key={`${detail.rowNumber}-${detail.field}-${index}`}>
                {detail.rowNumber && `Row ${detail.rowNumber}`}
                {detail.field && ` · ${detail.field}`}: {detail.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
