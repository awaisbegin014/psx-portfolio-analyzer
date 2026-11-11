import { Router } from 'express';
import multer from 'multer';

import { environment } from '../config/environment.js';
import { calculatePortfolio } from '../domain/portfolio-calculator.js';
import { CsvValidationError } from '../services/csv-validation-error.js';
import { parseTradesCsv } from '../services/csv-parser.js';

interface PortfolioRouteDependencies {
  loadPrices: () => Promise<ReadonlyMap<string, number>>;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: environment.maxUploadSizeBytes,
    files: 1,
  },
});

export function createPortfolioRouter({ loadPrices }: PortfolioRouteDependencies): Router {
  const router = Router();

  router.post('/', upload.single('trades'), async (request, response, next) => {
    try {
      if (!request.file) {
        response.status(400).json({
          error: {
            code: 'FILE_REQUIRED',
            message: 'Attach a trades CSV using the “trades” file field.',
          },
        });
        return;
      }

      if (!request.file.originalname.toLowerCase().endsWith('.csv')) {
        throw new CsvValidationError('The uploaded file must use the .csv extension.');
      }

      const trades = parseTradesCsv(request.file.buffer, environment.maxTradeRows);
      const prices = await loadPrices();
      const result = calculatePortfolio(trades, prices);

      response.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
