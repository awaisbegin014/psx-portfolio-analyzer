import { useState } from 'react';

import { FileUpload } from './components/FileUpload';
import { HoldingsTable } from './components/HoldingsTable';
import { PortfolioSummary } from './components/PortfolioSummary';
import { ValidationMessage } from './components/ValidationMessage';
import { analyzePortfolio, type PortfolioApiError } from './services/portfolio-api';
import type { PortfolioAnalysis } from './types/portfolio';

const MAX_FILE_SIZE_BYTES = 1_048_576;

function validateFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return 'Choose a file with the .csv extension.';
  }

  if (file.size === 0) {
    return 'The selected file is empty.';
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'The selected file must be 1 MB or smaller.';
  }

  return null;
}

export function App() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [error, setError] = useState<PortfolioApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (nextFile: File) => {
    const validationError = validateFile(nextFile);
    setAnalysis(null);

    if (validationError) {
      setFile(null);
      setError(Object.assign(new Error(validationError), { details: [] }));
      return;
    }

    setFile(nextFile);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError(
        Object.assign(new Error('Choose a trades CSV before running the analysis.'), {
          details: [],
        }),
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setAnalysis(null);

    try {
      setAnalysis(await analyzePortfolio(file));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? (caughtError as PortfolioApiError)
          : Object.assign(new Error('The portfolio could not be analysed. Please try again.'), {
              details: [],
            }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="PSX Portfolio Analyzer home">
            <span className="brand-mark" aria-hidden="true">
              PX
            </span>
            <span className="brand-copy">
              <strong>Portfolio Analyzer</strong>
              <span>Pakistan Stock Exchange</span>
            </span>
          </a>
          <div className="method-label">
            <span className="status-dot" aria-hidden="true" />
            Weighted average method
          </div>
        </div>
      </header>

      <main id="top" className="page-content">
        <section className="intro" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Portfolio analysis</p>
            <h1 id="page-title">Review your current PSX holdings.</h1>
            <p className="intro-copy">
              Upload a trade history to calculate open positions, cost basis, current value, and
              unrealised performance using the supplied market prices.
            </p>
          </div>
          <dl className="calculation-note">
            <div>
              <dt>Brokerage</dt>
              <dd>0.15% per trade</dd>
            </div>
            <div>
              <dt>Cost method</dt>
              <dd>Perpetual weighted average</dd>
            </div>
          </dl>
        </section>

        <section className="upload-card" aria-labelledby="upload-title">
          <div className="section-heading">
            <div>
              <p className="section-index">01</p>
              <div>
                <h2 id="upload-title">Upload trade history</h2>
                <p>Use the supplied CSV or another file with the same columns.</p>
              </div>
            </div>
            <code>date, symbol, side, quantity, price</code>
          </div>

          <FileUpload
            file={file}
            isSubmitting={isSubmitting}
            onFileChange={handleFileChange}
            onSubmit={handleSubmit}
          />

          <ValidationMessage error={error} />
        </section>

        {analysis ? (
          <section className="results-section" aria-labelledby="results-title">
            <div className="results-heading">
              <div>
                <p className="section-index">02</p>
                <div>
                  <h2 id="results-title">Current portfolio</h2>
                  <p>
                    {analysis.summary.tradeCount} trades processed ·{' '}
                    {analysis.summary.openPositionCount} open positions
                  </p>
                </div>
              </div>
              <span className="analysis-status">Analysis complete</span>
            </div>

            <PortfolioSummary analysis={analysis} />
            <HoldingsTable analysis={analysis} />

            <p className="results-footnote">
              Average cost includes brokerage on purchases. Values are rounded for display; all
              calculations use full decimal precision.
            </p>
          </section>
        ) : (
          <section className="process-note" aria-labelledby="process-title">
            <div className="process-heading">
              <p className="section-index">Method</p>
              <h2 id="process-title">A transparent calculation path</h2>
            </div>
            <ol>
              <li>
                <span>1</span>
                <div>
                  <strong>Validate</strong>
                  <p>Check every trade row and reject inconsistent positions.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Calculate</strong>
                  <p>Apply brokerage and update each position in date order.</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Value</strong>
                  <p>Match open holdings with the latest supplied PSX prices.</p>
                </div>
              </li>
            </ol>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <div>
          <span>PSX Portfolio Analyzer</span>
          <span>Sample portfolio data only</span>
        </div>
      </footer>
    </div>
  );
}
