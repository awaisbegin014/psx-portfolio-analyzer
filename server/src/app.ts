import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import express from 'express';
import helmet from 'helmet';

import { errorHandler } from './middleware/error-handler.js';
import { createPortfolioRouter } from './routes/portfolio-route.js';
import { loadCurrentPrices } from './services/price-loader.js';

export interface AppDependencies {
  loadPrices: () => Promise<ReadonlyMap<string, number>>;
}

const clientDistDirectory = fileURLToPath(new URL('../../client/dist', import.meta.url));

export function createApp(
  dependencies: AppDependencies = { loadPrices: loadCurrentPrices },
): express.Express {
  const application = express();

  application.disable('x-powered-by');
  application.use(helmet());
  application.use(express.json({ limit: '32kb' }));

  application.get('/api/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  application.use('/api/portfolio', createPortfolioRouter(dependencies));

  application.use('/api', (_request, response) => {
    response.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested API endpoint does not exist.',
      },
    });
  });

  if (existsSync(clientDistDirectory)) {
    application.use(
      express.static(clientDistDirectory, {
        etag: true,
        maxAge: '1h',
      }),
    );

    application.get(/.*/, (_request, response) => {
      response.sendFile('index.html', { root: clientDistDirectory });
    });
  }

  application.use(errorHandler);

  return application;
}

export const app = createApp();
