import { z } from 'zod';

const positiveInteger = (fallback: number) => z.coerce.number().int().positive().default(fallback);

const environmentSchema = z.object({
  PORT: positiveInteger(4000),
  MAX_UPLOAD_SIZE_BYTES: positiveInteger(1_048_576),
  MAX_TRADE_ROWS: positiveInteger(10_000),
});

const parsedEnvironment = environmentSchema.parse(process.env);

export const environment = {
  port: parsedEnvironment.PORT,
  maxUploadSizeBytes: parsedEnvironment.MAX_UPLOAD_SIZE_BYTES,
  maxTradeRows: parsedEnvironment.MAX_TRADE_ROWS,
};
