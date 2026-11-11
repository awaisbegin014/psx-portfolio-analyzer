import type { ErrorRequestHandler } from 'express';
import multer from 'multer';

import { PortfolioCalculationError } from '../domain/portfolio-error.js';
import { CsvValidationError } from '../services/csv-validation-error.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    const isTooLarge = error.code === 'LIMIT_FILE_SIZE';
    response.status(isTooLarge ? 413 : 400).json({
      error: {
        code: isTooLarge ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR',
        message: isTooLarge
          ? 'The uploaded file exceeds the allowed size.'
          : 'The file upload could not be processed.',
      },
    });
    return;
  }

  if (error instanceof CsvValidationError) {
    response.status(422).json({
      error: {
        code: 'INVALID_CSV',
        message: error.message,
        ...(error.issues.length > 0 && { details: error.issues }),
      },
    });
    return;
  }

  if (error instanceof PortfolioCalculationError) {
    response.status(422).json({
      error: {
        code: 'INVALID_PORTFOLIO',
        message: error.message,
        ...(error.rowNumber && { details: [{ rowNumber: error.rowNumber }] }),
      },
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'The portfolio could not be processed. Please try again.',
    },
  });
};
